import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ModelId } from '../types';
import { MODELS } from '../constants';
import { generateStructuredContent } from '../services/geminiService';
import { Type } from "@google/genai";
import { SendIcon, UsersIcon, TrashIcon, PlusIcon, UserIcon, ArrowLeftIcon } from './Icons';

interface Agent {
    id: number;
    name: string;
    modelId: ModelId.ADAPTIVE | ModelId.QUALITY;
    color: string;
}

interface SocialMessage {
    id: string;
    sender: 'User' | string;
    content: string;
    isUser: boolean;
    color: string;
}

const AGENT_COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899'];

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
    setTimeout(() => circle.remove(), 600);
};

export const SocialChatView: React.FC = () => {
    const [view, setView] = useState<'setup' | 'chat'>('setup');
    const [topic, setTopic] = useState('');
    const [agentCount, setAgentCount] = useState(2);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [messages, setMessages] = useState<SocialMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setAgents(prevAgents => {
            const newAgents: Agent[] = Array.from({ length: agentCount }, (_, i) => ({
                id: i,
                name: `مساعد ${i + 1}`,
                modelId: ModelId.ADAPTIVE,
                color: AGENT_COLORS[i % AGENT_COLORS.length],
            }));
            prevAgents.forEach((pa, i) => {
                if (newAgents[i]) {
                    newAgents[i].name = pa.name;
                    newAgents[i].modelId = pa.modelId;
                }
            });
            return newAgents;
        });
    }, [agentCount]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleAgentChange = (id: number, field: 'name' | 'modelId', value: string) => {
        setAgents(prev => prev.map(agent => agent.id === id ? { ...agent, [field]: value } : agent));
    };

    const startMeeting = () => {
        if (topic.trim() && agents.every(a => a.name.trim())) {
            setView('chat');
        } else {
            alert('يرجى تحديد موضوع للاجتماع وأسماء جميع المشاركين.');
        }
    };

    const endMeeting = () => {
        if (window.confirm("هل أنت متأكد من رغبتك في إنهاء هذا الاجتماع؟")) {
            setView('setup');
            setMessages([]);
            setTopic('');
            setAgentCount(2);
        }
    }

    const handleSendMessage = useCallback(async () => {
        const userInput = input.trim();
        if (!userInput || isLoading) return;
        
        setInput('');
        setIsLoading(true);

        const newUserMessage: SocialMessage = {
            id: Date.now().toString(),
            sender: 'User',
            content: userInput,
            isUser: true,
            color: '#747775'
        };
        const currentMessages = [...messages, newUserMessage];
        setMessages(currentMessages);

        const masterPrompt = `أنت كاتب سيناريو خبير في إدارة النقاشات متعددة الأطراف.
موضوع النقاش هو: "${topic}"
المشاركون هم:
- المستخدم (إنسان)
${agents.map(a => `- ${a.name} (مساعد ذكاء اصطناعي، شخصيته: '${MODELS[a.modelId].name}')`).join('\n')}

هذا هو سجل المحادثة حتى الآن:
${currentMessages.map(m => `${m.sender}: ${m.content}`).join('\n\n')}

قال المستخدم للتو: "${userInput}"

مهمتك هي كتابة الجزء التالي من الحوار. اجعل واحدًا أو أكثر من مساعدي الذكاء الاصطناعي يستجيبون بشكل طبيعي. يمكنهم الموافقة أو الاختلاف أو البناء على نقاط بعضهم البعض. تأكد من أن المحادثة تتدفق بشكل جيد ومنطقي.

قم بتنسيق ردك كمصفوفة JSON من الكائنات، حيث يحتوي كل كائن على مفتاح "speaker" (اسم المساعد) و "message" (ما يقوله).
مثال على الإخراج:
[
  {"speaker": "${agents[0]?.name || 'Agent 1'}", "message": "هذه نقطة مثيرة للاهتمام."},
  {"speaker": "${agents[1]?.name || 'Agent 2'}", "message": "أتفق مع ذلك، وأود أن أضيف..."}
]

**قواعد صارمة:**
- يجب أن يكون الإخراج مصفوفة JSON صالحة فقط.
- لا تقم بتضمين أي رد من "المستخدم". قم فقط بإنشاء ردود للمساعدين الافتراضيين.
- يمكن أن يكون عدد الردود في المصفوفة واحدًا أو أكثر، حسب ما تراه مناسبًا لتدفق الحوار.`;

        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    speaker: { type: Type.STRING },
                    message: { type: Type.STRING }
                },
                required: ["speaker", "message"]
            }
        };

        try {
            const scriptedReplies: any = await generateStructuredContent(ModelId.QUALITY, masterPrompt, MODELS[ModelId.QUALITY].systemInstruction, schema);

            if (scriptedReplies && Array.isArray(scriptedReplies)) {
                let tempMessages = [...currentMessages];
                for (const reply of scriptedReplies) {
                    const agent = agents.find(a => a.name === reply.speaker);
                    if (!agent) continue;

                    const messageId = Date.now().toString() + Math.random();
                    const placeholderMessage: SocialMessage = { id: messageId, sender: reply.speaker, content: '', isUser: false, color: agent.color };
                    
                    setMessages([...tempMessages, placeholderMessage]);
                    
                    for (let i = 0; i < reply.message.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, 25));
                        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: reply.message.substring(0, i + 1) } : m));
                    }
                    tempMessages.push({ ...placeholderMessage, content: reply.message });
                    await new Promise(resolve => setTimeout(resolve, 400));
                }
            } else {
                 setMessages(prev => [...prev, { id: 'error', sender: 'النظام', content: 'لم أتمكن من إنشاء رد جماعي. حاول مرة أخرى.', isUser: false, color: '#EF4444' }]);
            }
        } catch (error) {
            console.error("Failed to generate social response:", error);
             setMessages(prev => [...prev, { id: 'error', sender: 'النظام', content: 'حدث خطأ أثناء معالجة الرد الجماعي.', isUser: false, color: '#EF4444' }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, agents, topic, messages]);

    if (view === 'setup') {
        return (
            <div className="flex-1 flex flex-col justify-center items-center p-4 overflow-y-auto pt-16">
                <div className="w-full max-w-2xl">
                    <div className="text-center mb-8">
                        <UsersIcon className="w-16 h-16 mx-auto text-[var(--token-text-tertiary)]" />
                        <h1 className="text-3xl font-bold mt-4 text-[var(--token-text-primary)]">اجتماع موهو الاجتماعي</h1>
                        <p className="text-lg text-[var(--token-text-secondary)] mt-2">قم بإعداد جلسة عصف ذهني مع مساعدين افتراضيين.</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="topic" className="block text-sm font-medium text-[var(--token-text-secondary)] mb-1">موضوع الاجتماع</label>
                            <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="مثال: التخطيط لرحلة إلى المريخ" className="w-full p-3 bg-[var(--token-main-surface-secondary)] border border-[var(--token-border-default)] rounded-xl focus:ring-2 focus:ring-[var(--token-interactive-bg-primary)] outline-none" />
                        </div>

                        <div>
                            <label htmlFor="agentCount" className="block text-sm font-medium text-[var(--token-text-secondary)] mb-2">عدد المشاركين (2-5)</label>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-lg text-[var(--token-text-primary)]">{agentCount}</span>
                                <input type="range" id="agentCount" min="2" max="5" value={agentCount} onChange={e => setAgentCount(Number(e.target.value))} className="w-full h-2 bg-[var(--token-main-surface-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--token-interactive-bg-primary)]" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {agents.map(agent => (
                                <div key={agent.id} className="p-3 bg-[var(--token-main-surface-secondary)] border border-[var(--token-border-default)] rounded-xl flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full grid place-content-center flex-shrink-0" style={{ backgroundColor: agent.color }}>
                                        <UserIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <input type="text" value={agent.name} onChange={e => handleAgentChange(agent.id, 'name', e.target.value)} className="flex-grow p-2 bg-[var(--token-main-surface-primary)] border border-[var(--token-border-default)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--token-interactive-bg-primary)]" />
                                    <select value={agent.modelId} onChange={e => handleAgentChange(agent.id, 'modelId', e.target.value as ModelId)} className="p-2 bg-[var(--token-main-surface-primary)] border border-[var(--token-border-default)] rounded-lg outline-none focus:ring-1 focus:ring-[var(--token-interactive-bg-primary)]">
                                        <option value={ModelId.ADAPTIVE}>السريع</option>
                                        <option value={ModelId.QUALITY}>المعقد</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button onClick={startMeeting} className="w-full mt-8 py-3 px-6 bg-[var(--token-interactive-bg-primary)] text-[var(--token-text-on-primary)] font-semibold rounded-xl text-lg hover:bg-[var(--token-interactive-bg-primary-hover)] transition-colors shadow-lg">
                        بدء الاجتماع
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-[var(--token-border-default)] pt-20 bg-[var(--token-main-surface-primary)]/80 backdrop-blur-md">
                <div>
                    <h2 className="font-bold text-lg text-[var(--token-text-primary)]">الموضوع: {topic}</h2>
                    <div className="flex items-center gap-2 text-xs text-[var(--token-text-secondary)]">
                        {agents.map(a => <span key={a.id} className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: a.color}}></div>{a.name}</span>)}
                    </div>
                </div>
                <button onClick={endMeeting} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-500/10 rounded-full hover:bg-red-500/20 transition-colors">إنهاء الاجتماع</button>
            </header>
            <div className="flex-1 overflow-y-auto px-4 space-y-4 pt-4 pb-48">
                {messages.map((msg, index) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                        {!msg.isUser && (
                            <div className="w-8 h-8 rounded-full grid place-content-center flex-shrink-0" style={{ backgroundColor: msg.color }}>
                                <UserIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div className={`max-w-xl p-3 rounded-2xl ${msg.isUser ? 'bg-[var(--token-interactive-bg-primary-container)] text-[var(--token-on-primary-container)] rounded-br-lg' : 'bg-[var(--token-main-surface-secondary)] rounded-bl-lg shadow-sm'}`}>
                            {!msg.isUser && <p className="font-bold text-sm mb-1" style={{color: msg.color}}>{msg.sender}</p>}
                            <p className="whitespace-pre-wrap text-sm">{msg.content}{isLoading && index === messages.length -1 && <span className="inline-block w-1.5 h-4 bg-current ml-1 animate-ping"></span>}</p>
                        </div>
                    </div>
                ))}
                {isLoading && messages.length > 0 && messages[messages.length - 1].isUser && (
                     <div className="flex justify-start">
                        <div className="flex items-center gap-2.5 text-[var(--token-text-tertiary)]">
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse-grow"></div>
                            <span className="text-sm">يفكر...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 w-full px-4 pb-4 bg-gradient-to-t from-[var(--token-main-surface-primary)] to-transparent">
                <div className="max-w-3xl mx-auto">
                    <div className="relative flex min-h-[56px] items-end w-full p-2 rounded-3xl bg-[var(--token-main-surface-secondary)] border border-[var(--token-border-default)] shadow-lg">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="شارك بفكرتك..."
                            className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-[var(--token-text-primary)] placeholder:text-[var(--token-text-tertiary)] text-base max-h-48 self-center px-2"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button onClick={(e) => { createRipple(e); handleSendMessage(); }} disabled={!input.trim() || isLoading} className="relative overflow-hidden w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 enabled:bg-[var(--token-interactive-bg-primary)] enabled:text-[var(--token-text-on-primary)] enabled:hover:bg-[var(--token-interactive-bg-primary-hover)] disabled:bg-[var(--token-main-surface-tertiary)] disabled:text-[var(--token-icon-tertiary)] disabled:cursor-not-allowed flex-shrink-0" aria-label="إرسال">
                           <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};