import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateContentStream, getResearchPlan, executeResearch, processFilesForApi, generateImage } from '../services/geminiService';
import type { GenerateContentResponse } from '@google/genai';
import { MODELS } from '../constants';
import { ModelId, type Message, type QuranScrollLocation, ChartData, DeepThinking, WhiteboardStep } from '../types';
import { MessageRenderer } from './MessageRenderer';
import { PaperclipIcon, SendIcon, SparkleIcon, FileTextIcon, XIcon, ImagePlaceholderIcon, BrainIcon, GlobeIcon, ChartBarIcon, PaletteIcon, LayoutIcon, MicrophoneIcon, StopCircleIcon, DownloadIcon, MusicIcon, TrashIcon } from './Icons';
import QRCode from 'qrcode';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatViewProps {
  modelId: ModelId;
  setScrollToLocation?: (location: QuranScrollLocation | null) => void;
  setPlayLocation?: (location: QuranScrollLocation | null) => void;
  isDesignModeEnabled?: boolean;
  toggleDesignMode?: () => void;
  setDesignContent?: (content: string) => void;
  onModelChangeAndSetPrompt?: (modelId: ModelId, prompt: string) => void;
  initialPrompt?: string | null;
  clearInitialPrompt?: () => void;
  systemInstructionOverride?: string;
  inputFontClass?: string;
  onNewMessages?: (messages: Message[]) => void;
}

const ForwardModal: React.FC<{
    currentModelId: ModelId;
    onSelectModel: (modelId: ModelId) => void;
    onClose: () => void;
}> = ({ currentModelId, onSelectModel, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[var(--token-main-surface-primary)] rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                 <div className="p-4 border-b border-[var(--token-border-default)]">
                    <h3 className="font-semibold text-lg text-center text-[var(--token-text-primary)]">إعادة توجيه إلى...</h3>
                </div>
                <div className="p-2">
                    {Object.values(MODELS)
                        // FIX: Filter out the SOCIAL model as it has a different flow and cannot be forwarded to.
                        .filter(model => model.id !== currentModelId && model.id !== ModelId.SOCIAL)
                        .map(model => (
                            <button
                                key={model.id}
                                onClick={() => onSelectModel(model.id)}
                                className="w-full flex items-center gap-4 text-right p-3 rounded-lg hover:bg-[var(--token-main-surface-secondary)] transition-colors"
                            >
                                <model.Icon className="w-6 h-6 text-[var(--token-icon-secondary)]" />
                                <div>
                                    <p className="font-semibold text-[var(--token-text-primary)]">{model.name}</p>
                                    <p className="text-xs text-[var(--token-text-secondary)]">
                                        {model.id === ModelId.ADAPTIVE && "للإجابات السريعة والمهام اليومية"}
                                        {model.id === ModelId.QUALITY && "للمهام المعقدة والتحليل العميق"}
                                        {model.id === ModelId.RESEARCHER && "للبحث المتخصص وجمع المعلومات"}
                                    </p>
                                </div>
                            </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    const rect = button.getBoundingClientRect();
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add("ripple");

    const existingRipple = button.querySelector(".ripple");
    if (existingRipple) {
        existingRipple.remove();
    }
    
    button.appendChild(circle);
    
    setTimeout(() => {
        if (circle.parentElement) {
            circle.remove();
        }
    }, 600);
};

const LoadingIndicator: React.FC = () => (
    <div className="flex space-x-2">
        <div className="w-20 h-3 rounded-full loading-shimmer-bar"></div>
        <div className="w-28 h-3 rounded-full loading-shimmer-bar"></div>
        <div className="w-16 h-3 rounded-full loading-shimmer-bar"></div>
    </div>
);

// This function centralizes all parsing of special content from the model's response.
const parseMessageContent = async (rawContent: string): Promise<Partial<Message>> => {
    let content = rawContent;
    
    let qrCodeSVG: string | null = null;
    let chartData: ChartData | null = null;
    let deepThinking: DeepThinking | null = null;
    let designContent: string | null = null;
    let whiteboardSteps: WhiteboardStep[] | null = null;
    const mermaidCodes: string[] = [];

    // QR Code
    const qrRegex = /\[QR_CODE_GENERATE:({.*?})\]\s*/g;
    const lastQrMatch = [...content.matchAll(qrRegex)].pop(); // Get the last match
    if (lastQrMatch) {
        try {
            const payload = JSON.parse(lastQrMatch[1]);
            if (payload.content) {
                qrCodeSVG = await QRCode.toString(payload.content, {
                    type: 'svg', margin: 2,
                    color: { dark: document.documentElement.classList.contains('dark') ? '#E3E3E3' : '#1F1F1F', light: '#00000000' }
                });
                // If successful, strip all QR commands
                content = content.replace(qrRegex, '');
            }
        } catch (e) {
            // Incomplete JSON, will be re-parsed on next chunk
            console.warn("Could not parse QR code JSON yet, might be streaming.", e);
        }
    }
    
    // Helper to extract a block and remove it from content
    const extractBlock = (regex: RegExp): string | null => {
        const match = content.match(regex);
        if (match && match[1]) {
            content = content.replace(regex, '').trim();
            return match[1];
        }
        return null;
    };
    
    // Charts
    const chartJson = extractBlock(/```json:chart\n([\s\S]*?)\n```/);
    if (chartJson) {
        try { 
            chartData = JSON.parse(chartJson); 
        } catch (e) { 
            console.error("Failed to parse chart JSON:", e);
            // Restore content on failure to allow re-parsing
            content = `\`\`\`json:chart\n${chartJson}\n\`\`\`\n` + content; 
        }
    }
    
    // Deep Thinking
    const dtBlock = extractBlock(/\*\*\[DEEP_THINKING_START\]\*\*\n([\s\S]*?)\n\*\*\[DEEP_THINKING_END\]\*\*/);
    if (dtBlock) {
        const methodMatch = dtBlock.match(/\*\*المنهجية:\*\*\s*(.*)/);
        const planMatch = dtBlock.match(/\*\*الخطة:\*\*\s*([\s\S]*)/);
        if (methodMatch && planMatch) {
            deepThinking = { method: methodMatch[1].trim(), plan: planMatch[1].trim().split('\n').map(s => s.replace(/-\s*/, '').trim()).filter(Boolean) };
        } else {
             // Restore content on failure to allow re-parsing
             content = `**[DEEP_THINKING_START]**\n${dtBlock}\n**[DEEP_THINKING_END]**\n` + content;
        }
    }
    
    // Whiteboard - find all blocks, parse them, and replace if all are valid
    const whiteboardRegex = /\[WHITEBOARD_START\]\s*([\s\S]*?)\s*\[WHITEBOARD_END\]/g;
    const whiteboardMatches = [...content.matchAll(whiteboardRegex)];
    if (whiteboardMatches.length > 0) {
        const tempSteps: WhiteboardStep[] = [];
        let parsingFailed = false;
        for (const match of whiteboardMatches) {
            const jsonString = match[1].trim();
            try {
                const parsed = JSON.parse(jsonString);
                if (Array.isArray(parsed)) {
                    // Flatten to handle cases where the model might wrap the array in another array, e.g., [[...]]
                    tempSteps.push(...parsed.flat()); 
                }
            } catch (e) {
                parsingFailed = true;
                console.warn("Incomplete or invalid whiteboard JSON, will retry on next chunk.", e);
                break; // Stop parsing if any block is invalid, assuming it's an incomplete stream.
            }
        }

        if (!parsingFailed && tempSteps.length > 0) {
            whiteboardSteps = tempSteps;
            content = content.replace(whiteboardRegex, '').trim();
        }
    }

    // Design
    designContent = extractBlock(/```html:design\n([\s\S]*?)\n```/);
    
    // Mermaid
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    const mermaidMatches = [...content.matchAll(mermaidRegex)];
    if (mermaidMatches.length > 0) {
        mermaidMatches.forEach(match => mermaidCodes.push(match[1]));
        content = content.replace(mermaidRegex, '');
    }
    
    return { content, chartData, deepThinking, designContent, mermaidCodes, qrCodeSVG, whiteboardSteps };
};


export const ChatView: React.FC<ChatViewProps> = ({ 
    modelId, 
    setScrollToLocation, 
    setPlayLocation, 
    isDesignModeEnabled, 
    toggleDesignMode, 
    setDesignContent,
    onModelChangeAndSetPrompt,
    initialPrompt,
    clearInitialPrompt,
    systemInstructionOverride,
    inputFontClass,
    onNewMessages,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [forwardingContent, setForwardingContent] = useState<string | null>(null);
  
  const currentModel = MODELS[modelId];

  // Feature Toggles
  const [isDeepThinkingEnabled, setIsDeepThinkingEnabled] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(currentModel?.features.webSearch || false);
  const [isChartGenerationEnabled, setIsChartGenerationEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const stopGenerationRef = useRef(false);
  const messagesRef = useRef(messages);
  const processedWhiteboardRef = useRef(new Set());
  
  useEffect(() => {
    messagesRef.current = messages;
    onNewMessages?.(messages);
  }, [messages, onNewMessages]);

  useEffect(() => {
    if (initialPrompt && clearInitialPrompt) {
        setInput(initialPrompt);
        clearInitialPrompt();
    }
  }, [initialPrompt, clearInitialPrompt]);

  useEffect(() => {
    // Reset feature toggles when model changes
    setIsDeepThinkingEnabled(false);
    setIsWebSearchEnabled(currentModel?.features.webSearch || false);
    setIsChartGenerationEnabled(false);
    if (modelId !== ModelId.QUALITY && isDesignModeEnabled && toggleDesignMode) {
      toggleDesignMode();
    }
  }, [modelId, currentModel, isDesignModeEnabled, toggleDesignMode]);
  
  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prevInput => (prevInput ? prevInput + ' ' : '') + transcript);
    };
    
    recognition.onend = () => {
        setIsListening(false);
    };

    recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
            alert('تم رفض الوصول إلى الميكروفون. يرجى السماح بالوصول في إعدادات المتصفح.');
        }
        setIsListening(false);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages, isLoading]);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input, attachments]);
  
  const handleListen = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        console.error("Could not start speech recognition:", e);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
          const newFiles = Array.from(event.target.files);
          if (attachments.length + newFiles.length > 10) {
              alert('يمكنك إرفاق 10 ملفات كحد أقصى لكل رسالة.');
              return;
          }
          setAttachments(prev => [...prev, ...newFiles]);
          event.target.value = '';
      }
  };

  const handleRemoveAttachment = (fileToRemove: File) => {
      setAttachments(prev => prev.filter(file => file !== fileToRemove));
  };
  
  const handleStopGeneration = () => {
    stopGenerationRef.current = true;
  };

  const handleExecuteResearch = useCallback(async (messageId: string, plan: string[]) => {
      const currentMessages = messagesRef.current;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isPlanExecuted: true, researchPlan: plan } : m));
      setIsLoading(true);

      const planMessageIndex = currentMessages.findIndex(m => m.id === messageId);
      if (planMessageIndex === -1) {
          setIsLoading(false);
          return;
      }
      const userMessageForResearch = currentMessages.slice(0, planMessageIndex).reverse().find(m => m.role === 'user');
      const researchTopic = userMessageForResearch?.content || "the user's request";

      const assistantMessageId = Date.now().toString();
      const assistantMessage: Message = { id: assistantMessageId, role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      const history = currentMessages
          .filter(m => !(m.researchPlan && !m.isPlanExecuted))
          .map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
          }));

      try {
          const stream = await executeResearch(researchTopic, plan, history);
          let finalContent = '';
          let sources: Message['sources'] = [];

          for await (const chunk of stream) {
              if (stopGenerationRef.current) break;

              finalContent += chunk.text;
              sources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((s: any) => s.web).filter(Boolean) || sources;
              
              const parsedData = await parseMessageContent(finalContent);
              if (parsedData.designContent && setDesignContent) setDesignContent(parsedData.designContent);

              setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, ...parsedData, sources } : m));
          }
      } catch (error) {
          console.error(error);
          setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: 'عذراً، حدث خطأ أثناء تنفيذ البحث. يرجى المحاولة مرة أخرى.' } : m));
      } finally {
          setIsLoading(false);
          stopGenerationRef.current = false;
      }
  }, [setDesignContent]);

  const handleSendMessage = useCallback(async (messageContent: string, isHiddenFromHistory?: boolean) => {
    if (isLoading || (!messageContent.trim() && attachments.length === 0)) return;
    
    const startTime = Date.now();
    stopGenerationRef.current = false;
    
    const combinedAttachments = [...attachments];
    
    const currentInput = input;
    setInput('');
    setAttachments([]);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      attachments: combinedAttachments.map(f => ({ name: f.name, mimeType: f.type, size: f.size }))
    };

    if (!isHiddenFromHistory) {
      setMessages(prev => [...prev, userMessage]);
    }

    const isResearchMode = modelId === ModelId.RESEARCHER && !isHiddenFromHistory;

    if (isResearchMode) {
        setIsLoading(true);
        try {
            const plan = await getResearchPlan(messageContent);
            if (plan && plan.length > 0) {
                const planMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: '', // The component itself provides the introductory text
                    researchPlan: plan,
                    isPlanExecuted: false,
                };
                setMessages(prev => [...prev, planMessage]);
            } else {
                throw new Error("Failed to generate a research plan.");
            }
        } catch (e) {
            console.error(e);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "عذراً، لم أتمكن من إنشاء خطة بحث. هل يمكنك إعادة صياغة طلبك أو تبسيطه؟"
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
        return;
    }


    setIsLoading(true);
    const assistantMessageId = (Date.now() + 1).toString();
    let assistantMessage: Message = { id: assistantMessageId, role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);
    
    const history = messages
        .filter(m => !(m.researchPlan && !m.isPlanExecuted))
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));
    
    try {
      const fileParts = await processFilesForApi(combinedAttachments);
      const textPart = { text: messageContent };
      const userContentForApi = { 
        role: 'user', 
        parts: [textPart, ...fileParts].filter(p => (('text' in p && p.text.trim()) || 'inlineData' in p))
      };
      
      let finalContent = '';
      let sources: Message['sources'] = [];
      
      const stream: AsyncGenerator<GenerateContentResponse> = await generateContentStream(modelId, userContentForApi, history, isWebSearchEnabled, isDeepThinkingEnabled, systemInstructionOverride);

      for await (const chunk of stream) {
        if (stopGenerationRef.current) break;
        
        finalContent += chunk.text;
        sources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((s: any) => s.web).filter(Boolean) || sources;
        
        // Handle non-display commands separately
        const scrollPlayRegex = /\[(SCROLL_TO|PLAY_AYAH):({.*?})\]\s*/g;
        let match;
        const tempContentForExec = finalContent;
        while((match = scrollPlayRegex.exec(tempContentForExec)) !== null) {
            try {
                const command = match[1];
                const payload = JSON.parse(match[2]);
                if (command === 'SCROLL_TO' && setScrollToLocation) setScrollToLocation(payload);
                if (command === 'PLAY_AYAH' && setPlayLocation) setPlayLocation(payload);
            } catch(e) { console.error("Failed to parse command:", e); }
        }
        
        const contentToParse = finalContent.replace(scrollPlayRegex, '');
        
        const parsedData = await parseMessageContent(contentToParse);
        
        if (parsedData.designContent && setDesignContent) setDesignContent(parsedData.designContent);

        if (parsedData.whiteboardSteps && !processedWhiteboardRef.current.has(assistantMessageId)) {
            processedWhiteboardRef.current.add(assistantMessageId);
            (async () => {
                const finalSteps = await Promise.all(
                    // FIX: Add explicit return type to the map callback to ensure correct type inference for finalSteps.
                    parsedData.whiteboardSteps!.map(async (step): Promise<WhiteboardStep> => {
                        if (step.type === 'generate_image') {
                            try {
                                const imageUrl = await generateImage(step.content);
                                return { type: 'image', content: imageUrl };
                            } catch (e) {
                                console.error('Image generation failed for prompt:', step.content, e);
                                return { type: 'text', content: `**[فشل إنشاء الصورة]**\n_الموجه: "${step.content}"_` };
                            }
                        }
                        return step;
                    })
                );
                setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, whiteboardSteps: finalSteps } : m));
            })();
        }

        setMessages(prev => prev.map(m => {
            if (m.id === assistantMessageId) {
                const updatedMessage = { ...m, ...parsedData, sources };
                if (parsedData.whiteboardSteps) {
                    updatedMessage.whiteboardSteps = parsedData.whiteboardSteps.map(step => 
                        step.type === 'generate_image' 
                            ? { type: 'image_loading', content: step.content } 
                            : step
                    );
                }
                return updatedMessage;
            }
            return m;
        }));
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.' } : m));
    } finally {
      setIsLoading(false);
      stopGenerationRef.current = false;
      const duration = Date.now() - startTime;
      setMessages(prev => prev.map(m => {
        if (m.id === assistantMessageId && m.deepThinking) {
            return { ...m, deepThinking: { ...m.deepThinking, duration }};
        }
        return m;
      }));
    }
  }, [isLoading, modelId, messages, setScrollToLocation, setPlayLocation, attachments, isDeepThinkingEnabled, isWebSearchEnabled, setDesignContent, systemInstructionOverride, input]);
  
  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const originalMessage = messages[messageIndex];
    if (originalMessage.content.trim() === newContent.trim()) {
        setEditingMessageId(null);
        return;
    }
    
    setMessages(messages.slice(0, messageIndex));
    setEditingMessageId(null);
    setPendingPrompt(newContent);
  }, [messages]);

  useEffect(() => {
    if (pendingPrompt) {
      handleSendMessage(pendingPrompt);
      setPendingPrompt(null);
    }
  }, [pendingPrompt, handleSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) return;
      handleSendMessage(input);
    }
  };

  const handleForwardSelect = (targetModelId: ModelId) => {
    if (forwardingContent && onModelChangeAndSetPrompt) {
        onModelChangeAndSetPrompt(targetModelId, forwardingContent);
    }
    setForwardingContent(null);
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;

    const modelName = currentModel.name;
    const date = new Date().toISOString().split('T')[0];
    let markdownContent = `# محادثة موهو AI\n\n**النموذج:** ${modelName}\n**التاريخ:** ${date}\n\n---\n\n`;

    messages.forEach(message => {
        markdownContent += message.role === 'user' ? `**أنت:**\n` : `**مساعد موهو:**\n`;
        if (message.attachments && message.attachments.length > 0) {
            markdownContent += `*الملحقات: ${message.attachments.map(a => a.name).join(', ')}*\n\n`;
        }
        markdownContent += message.content.trim() + '\n\n---\n\n';
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moho-ai-chat-${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNewChat = () => {
    if (messages.length > 0 && window.confirm("هل أنت متأكد أنك تريد بدء محادثة جديدة؟ سيتم مسح المحادثة الحالية.")) {
        setMessages([]);
        processedWhiteboardRef.current.clear();
    }
  }
  
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative">
       {forwardingContent && (
            <ForwardModal
                currentModelId={modelId}
                onSelectModel={handleForwardSelect}
                onClose={() => setForwardingContent(null)}
            />
        )}
        {messages.length > 0 && !isLoading && !systemInstructionOverride && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
                <button 
                    onClick={handleNewChat}
                    className="p-2 rounded-full text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-tertiary)] transition-colors"
                    aria-label="محادثة جديدة"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={handleExportChat}
                    className="p-2 rounded-full text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-tertiary)] transition-colors"
                    aria-label="تصدير المحادثة"
                >
                    <DownloadIcon className="w-5 h-5" />
                </button>
            </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 space-y-6 pt-4 pb-48">
            {messages.length === 0 && !systemInstructionOverride ? (
                 <div className="flex flex-col items-center justify-center h-full text-center pb-16">
                    <h1 className="text-4xl md:text-5xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 mb-2">مرحباً، أنا موهو.</h1>
                    <h2 className="text-4xl md:text-5xl font-medium text-[var(--token-text-secondary)] mb-12">كيف يمكنني مساعدتك اليوم؟</h2>
                </div>
            ) : (
                messages.map((msg, index) => (
                    <MessageRenderer
                        key={msg.id}
                        message={msg}
                        editingMessageId={editingMessageId}
                        setEditingMessageId={setEditingMessageId}
                        onEditMessage={handleEditMessage}
                        onExecuteResearch={modelId === ModelId.RESEARCHER ? handleExecuteResearch : undefined}
                        // FIX: Disable forwarding when the onModelChangeAndSetPrompt callback is not provided.
                        onForward={onModelChangeAndSetPrompt ? setForwardingContent : undefined}
                        isStreaming={isLoading && msg.role === 'assistant' && index === messages.length - 1}
                    />
                ))
            )}
             {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                 <div className="flex justify-start">
                    <LoadingIndicator />
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 w-full px-4 pb-4 bg-gradient-to-t from-[var(--token-main-surface-primary)] via-[var(--token-main-surface-primary)] to-transparent">
            <div className="max-w-3xl mx-auto">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="relative">
                     <div className="flex flex-col w-full rounded-3xl bg-[var(--token-main-surface-secondary)] border border-[var(--token-border-default)] transition-all" style={{boxShadow: 'var(--elevation-2)'}}>
                        {attachments.length > 0 && (
                            <div className="p-3 border-b border-[var(--token-border-default)]">
                                <p className="text-xs text-[var(--token-text-secondary)] mb-2">الملفات المرفقة:</p>
                                <div className="flex flex-wrap gap-2">
                                    {attachments.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-[var(--token-main-surface-primary)] border border-[var(--token-border-default)] rounded-lg px-2 py-1 text-xs">
                                            {file.type.startsWith('image/') ? <ImagePlaceholderIcon className="w-4 h-4 text-[var(--token-icon-secondary)] flex-shrink-0" /> : file.type.startsWith('audio/') ? <MusicIcon className="w-4 h-4 text-[var(--token-icon-secondary)] flex-shrink-0" /> : <FileTextIcon className="w-4 h-4 text-[var(--token-icon-secondary)] flex-shrink-0" />}
                                            <span className="text-[var(--token-text-primary)] max-w-40 truncate" title={file.name}>{file.name}</span>
                                            <button type="button" onClick={() => handleRemoveAttachment(file)} className="text-[var(--token-icon-tertiary)] hover:text-[var(--token-text-primary)] flex-shrink-0"><XIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                         <div className="relative flex min-h-[56px] items-end w-full p-2">
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {currentModel?.features.fileUpload && (
                                    <><input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="*/*" /><button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 grid place-content-center rounded-full text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-tertiary)] transition-colors" aria-label="إرفاق ملفات"><PaperclipIcon className="w-5 h-5"/></button></>
                                )}
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isListening ? "جارِ الاستماع..." : "اسأل عن أي شيء..."}
                                className={`w-full bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-[var(--token-text-primary)] placeholder:text-[var(--token-text-tertiary)] text-base max-h-48 self-center px-2 ${inputFontClass || ''}`}
                                rows={1}
                                disabled={isLoading}
                            />
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button type="button" onClick={handleListen} className={`w-10 h-10 grid place-content-center rounded-full transition-colors ${isListening ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 animate-pulse' : 'text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-tertiary)]'}`} aria-label="استخدام الميكروفون"><MicrophoneIcon className="w-5 h-5" /></button>
                              {isLoading ? (
                                <button type="button" onClick={handleStopGeneration} className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900" aria-label="إيقاف التوليد"><StopCircleIcon className="w-5 h-5" /></button>
                              ) : (
                                <button type="submit" onClick={createRipple} disabled={!input.trim() && attachments.length === 0} className="relative overflow-hidden w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 enabled:bg-[var(--token-interactive-bg-primary)] enabled:text-[var(--token-text-on-primary)] enabled:hover:bg-[var(--token-interactive-bg-primary-hover)] disabled:bg-[var(--token-main-surface-tertiary)] disabled:text-[var(--token-icon-tertiary)] disabled:cursor-not-allowed" style={!isLoading && (input.trim() || attachments.length > 0) ? {boxShadow: 'var(--elevation-2)'} : {}} aria-label="إرسال"><SendIcon className="w-6 h-6" /></button>
                              )}
                            </div>
                         </div>
                         { !systemInstructionOverride && currentModel && (
                             <div className="flex items-center justify-start flex-wrap gap-x-2 gap-y-1 px-4 pb-2 -mt-1 text-xs">
                                    {currentModel.features.designTool && (
                                        <button type="button" onClick={toggleDesignMode} className={`flex items-center gap-1.5 py-1 px-2 rounded-full transition-colors ${isDesignModeEnabled ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-[var(--token-text-secondary)] hover:bg-[var(--token-main-surface-tertiary)]'}`} aria-label="تفعيل وضع التصميم">
                                            <LayoutIcon className="w-3.5 h-3.5"/> <span>تصميم</span>
                                        </button>
                                    )}
                                    {currentModel.features.deepThinking && (
                                        <button type="button" onClick={() => setIsDeepThinkingEnabled(!isDeepThinkingEnabled)} className={`flex items-center gap-1.5 py-1 px-2 rounded-full transition-colors ${isDeepThinkingEnabled ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-[var(--token-text-secondary)] hover:bg-[var(--token-main-surface-tertiary)]'}`} aria-label="تفعيل التفكير العميق">
                                            <BrainIcon className="w-3.5 h-3.5"/> <span>تفكير عميق</span>
                                        </button>
                                    )}
                                    {currentModel.features.webSearch && (
                                         <button type="button" onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)} className={`flex items-center gap-1.5 py-1 px-2 rounded-full transition-colors ${isWebSearchEnabled ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 'text-[var(--token-text-secondary)] hover:bg-[var(--token-main-surface-tertiary)]'}`} aria-label="تفعيل البحث في الويب">
                                            <GlobeIcon className="w-3.5 h-3.5"/> <span>بحث</span>
                                        </button>
                                    )}
                                    {currentModel.features.chartGeneration && (
                                         <button type="button" onClick={() => setIsChartGenerationEnabled(!isChartGenerationEnabled)} className={`flex items-center gap-1.5 py-1 px-2 rounded-full transition-colors ${isChartGenerationEnabled ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' : 'text-[var(--token-text-secondary)] hover:bg-[var(--token-main-surface-tertiary)]'}`} aria-label="تفعيل إنشاء المخططات">
                                            <ChartBarIcon className="w-3.5 h-3.5"/> <span>مخطط</span>
                                        </button>
                                    )}
                             </div>
                         )}
                     </div>
                </form>
            </div>
        </div>
    </div>
  );
};