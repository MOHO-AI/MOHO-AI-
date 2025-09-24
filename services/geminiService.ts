import { GoogleGenAI, Type, GenerateContentResponse, Part } from "@google/genai";
import mammoth from 'mammoth';
import { MODELS } from '../constants';
import { ModelId, ThinkingMode } from '../types';

// FIX: Hardcode the API keys directly as requested by the user.
const API_KEYS = [
  "AIzaSyBXFDNpFGI6mVAGO1AgxewWSOBOfoJm28g",
  "AIzaSyCvH1cc0OQUla0xfENcCBCLeV5ey11UevY",
  "AIzaSyCSCK0KGJpUK5XsrKG_0fwuGK4UeLr8Dbk",
  "AIzaSyBEcTQN2yO4jPSJCqzp4agG2LWc5oOVNF8"
];

if (API_KEYS.length === 0) {
    console.error("No API keys are provided in the hardcoded list. Please provide at least one key.");
    API_KEYS.push("NO_API_KEY_CONFIGURED"); 
}

let currentApiKeyIndex = 0;

const getGenAIInstance = () => {
    if (currentApiKeyIndex >= API_KEYS.length) {
        // This case should not be hit if logic is correct, but as a safeguard.
        throw new Error("All API keys have been exhausted.");
    }
    const apiKey = API_KEYS[currentApiKeyIndex];
    return new GoogleGenAI({ apiKey });
}


// Wrapper to handle API calls with key rotation.
async function callApi<T>(apiCallGenerator: (aiInstance: GoogleGenAI) => Promise<T>): Promise<T> {
    const initialKeyIndex = currentApiKeyIndex;
    while (true) {
        try {
            const ai = getGenAIInstance();
            return await apiCallGenerator(ai);
        } catch (error: any) {
            console.error(`Error with API key index ${currentApiKeyIndex}:`, error);
            const isQuotaError = error.toString().includes('429') || (error.message && /quota|exhausted/i.test(error.message));

            if (isQuotaError) {
                currentApiKeyIndex++;
                if (currentApiKeyIndex >= API_KEYS.length) {
                    currentApiKeyIndex = 0; // Cycle back to the start
                }
                if (currentApiKeyIndex === initialKeyIndex) {
                    // We've tried all keys and cycled back to the start.
                    throw new Error("All API keys are likely rate-limited or exhausted.");
                }
                console.warn(`Quota error encountered. Switched to API key index ${currentApiKeyIndex}.`);
                // The loop will automatically retry with the new key index.
            } else {
                throw error; // Non-quota error, rethrow immediately.
            }
        }
    }
}


const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

export const processFilesForApi = async (files: File[]): Promise<Part[]> => {
    const fileParts: Part[] = [];
    for (const file of files) {
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const textContent = await extractTextFromDocx(file);
            const formattedText = `\n\n--- Content of file: ${file.name} ---\n${textContent}\n--- End of file: ${file.name} ---`;
            fileParts.push({ text: formattedText });
        } else {
            const base64Data = await fileToBase64(file);
            fileParts.push({
                inlineData: {
                    mimeType: file.type,
                    data: base64Data,
                },
            });
        }
    }
    return fileParts;
};

// FIX: Update thinking config to align with guidelines (omit for general tasks).
const getThinkingConfig = (thinkingMode: ThinkingMode, modelId: ModelId, isDeepThinkingEnabled: boolean) => {
    if (isDeepThinkingEnabled && (modelId === ModelId.QUALITY || modelId === ModelId.RESEARCHER)) {
        return {}; // Enable full thinking for deep thinking tasks
    }
    
    switch(thinkingMode) {
        case 'SPEED': return { thinkingConfig: { thinkingBudget: 0 } };
        case 'QUALITY': return {}; // Default, enables full thinking
        case 'BALANCED':
        default:
             return {}; // Omit for default high-quality thinking.
    }
}

const getSystemInstructionWithTime = (baseInstruction: string) => {
    const now = new Date();
    const dateTimeString = now.toLocaleString('ar-SA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
    });
    return baseInstruction.replace('[CURRENT_DATETIME]', dateTimeString);
};


export const generateContentStream = async (
    modelId: ModelId, 
    userContentForApi: any, 
    history: any[], 
    isWebSearchEnabled: boolean,
    isDeepThinkingEnabled: boolean,
    systemInstructionOverride?: string
) => {
  const model = MODELS[modelId];
  const baseSystemInstruction = systemInstructionOverride || model.systemInstruction;
  const systemInstruction = getSystemInstructionWithTime(baseSystemInstruction);
  
  const apiCallGenerator = (ai_instance: GoogleGenAI) => ai_instance.models.generateContentStream({
    model: model.geminiModel,
    contents: [...history, userContentForApi],
    config: {
      systemInstruction: systemInstruction,
      tools: isWebSearchEnabled ? [{ googleSearch: {} }] : [],
      ...(model.geminiModel === 'gemini-2.5-flash' ? getThinkingConfig(ThinkingMode.BALANCED, modelId, isDeepThinkingEnabled) : {})
    }
  });

  // FIX: Explicitly type the return value of callApi to ensure type safety for streaming responses.
  return callApi<AsyncGenerator<GenerateContentResponse>>(apiCallGenerator);
};

export const generateSimpleText = async (modelId: ModelId, prompt: string, systemInstructionOverride: string) => {
    const model = MODELS[modelId];
    const baseSystemInstruction = systemInstructionOverride || model.systemInstruction;
    const systemInstruction = getSystemInstructionWithTime(baseSystemInstruction);
    
    const apiCallGenerator = (ai_instance: GoogleGenAI) => ai_instance.models.generateContent({
        model: model.geminiModel,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        }
    });

    // FIX: Explicitly type the return value of callApi to resolve 'unknown' type errors.
    const response = await callApi<GenerateContentResponse>(apiCallGenerator);
    return response.text;
}

export const generateStructuredContent = async (modelId: ModelId, prompt: string, systemInstructionOverride: string, responseSchema: any) => {
    const model = MODELS[modelId];
    const baseSystemInstruction = systemInstructionOverride || model.systemInstruction;
    const systemInstruction = getSystemInstructionWithTime(baseSystemInstruction);

    const apiCallGenerator = (ai_instance: GoogleGenAI) => ai_instance.models.generateContent({
        model: model.geminiModel,
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });
    
    // FIX: Explicitly type the return value of callApi and remove redundant type annotation.
    const response = await callApi<GenerateContentResponse>(apiCallGenerator);

    try {
        return JSON.parse(response.text);
    } catch(e) {
        console.error("Failed to parse structured JSON response", e);
        console.log("Raw text from API:", response.text);
        return null;
    }
}

export const getResearchPlan = async (prompt: string) => {
    const researchPlannerPrompt = `
    أنت مساعد بحث متخصص. مهمتك هي إنشاء خطة بحث مفصلة بناءً على طلب المستخدم.
    الطلب: "${prompt}"
    قم بإنشاء قائمة من خطوات البحث المقترحة. أخرج الخطة فقط ككائن JSON يحتوي على مفتاح "plan" وهو عبارة عن مصفوفة من السلاسل النصية (array of strings). لا تضف أي نص آخر.
    مثال للإخراج:
    { "plan": ["تحديد الشخصيات الرئيسية في الحدث.", "البحث عن التسلسل الزمني للأحداث."] }`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            plan: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    };

    const result = await generateStructuredContent(ModelId.RESEARCHER, researchPlannerPrompt, MODELS[ModelId.RESEARCHER].systemInstruction, schema);
    return result?.plan || [];
};

export const executeResearch = async (topic: string, plan: string[], history: any[]) => {
    const executionPrompt = `
    نفذ خطة البحث المعتمدة هذه لموضوع: "${topic}"
    الخطة:
    ${plan.map((step, index) => `${index + 1}. ${step}`).join('\n')}
    اتبع بدقة التعليمات الموجودة في "سير عمل البحث" لإنشاء تقريرك النهائي.`;
    const userContentForApi = { role: 'user', parts: [{ text: executionPrompt }] };
    return generateContentStream(ModelId.RESEARCHER, userContentForApi, history, true, true);
};