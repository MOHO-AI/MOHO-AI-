// FIX: Import useRef to resolve "Cannot find name 'useRef'" error.
import React, { useState, useEffect, useId, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { CheckIcon, CopyIcon, GlobeIcon, FileTextIcon, ImagePlaceholderIcon, ChevronDownIcon, ChevronUpIcon, PaletteIcon, LayoutIcon, EditIcon, MusicIcon, ShareIcon, CodeIcon, MaximizeIcon, XIcon, ZoomInIcon, ZoomOutIcon, RefreshCwIcon, DownloadIcon, CheckCircleIcon, TrashIcon, PlusIcon } from './Icons';
import type { Message, DeepThinking, ChartData, Source } from '../types';
import { CodeBlock } from './CodeBlock';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const TypingCursor: React.FC = () => <div className="typing-cursor"></div>;

const MermaidDiagram: React.FC<{ code: string }> = ({ code }) => {
    const [showCode, setShowCode] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const diagramContainerRef = useRef<HTMLDivElement>(null);
    const uniqueId = useId();

    useEffect(() => {
        const renderDiagram = async () => {
            if (!diagramContainerRef.current || isFullScreen) return;
            try {
                setError(null);
                const { svg } = await mermaid.render(uniqueId, code);
                if (diagramContainerRef.current) {
                    diagramContainerRef.current.innerHTML = svg;
                }
            } catch (e: any) {
                console.error("Mermaid rendering error:", e);
                setError(e.message || "An error occurred while rendering the diagram.");
                if (diagramContainerRef.current) {
                    diagramContainerRef.current.innerHTML = '';
                }
            }
        };
        if (!showCode) {
            renderDiagram();
        }
    }, [code, uniqueId, showCode, isFullScreen]);

    const DiagramError = () => (
        <div className="p-4 text-red-500 bg-red-500/10 h-full flex flex-col justify-center items-center">
            <h4 className="font-bold mb-2">خطأ في عرض المخطط</h4>
            <pre className="text-xs whitespace-pre-wrap">{error}</pre>
        </div>
    );
    
    return (
        <>
            <div className="my-4 border border-[var(--token-border-default)] rounded-lg overflow-hidden">
                <div className="p-2 bg-[var(--token-main-surface-tertiary)] flex justify-between items-center">
                     <span className="text-sm font-semibold px-2 text-[var(--token-text-secondary)]">مخطط توضيحي</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setShowCode(!showCode)} className="p-1.5 rounded-full text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-primary)] transition-colors" aria-label={showCode ? "إخفاء الكود" : "إظهار الكود"}>
                            <CodeIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsFullScreen(true)} className="p-1.5 rounded-full text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-primary)] transition-colors" aria-label="عرض ملء الشاشة">
                            <MaximizeIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {showCode ? (
                    <CodeBlock language="mermaid">{code}</CodeBlock>
                ) : (
                    <div className="h-96 overflow-auto resize-y bg-white dark:bg-gray-800 p-2 flex justify-center items-center">
                        {error ? <DiagramError /> : <div ref={diagramContainerRef} className="w-full h-full" />}
                    </div>
                )}
            </div>
            {isFullScreen && <FullScreenMermaid code={code} onClose={() => setIsFullScreen(false)} />}
        </>
    );
};

const FullScreenMermaid: React.FC<{ code: string, onClose: () => void }> = ({ code, onClose }) => {
    const uniqueId = useId();
    const [error, setError] = useState<string | null>(null);
    const diagramRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState({ scale: 1, posX: 0, posY: 0 });
    const panState = useRef({ isPanning: false, startX: 0, startY: 0 });
    const pinchState = useRef({ initialDist: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const render = async () => {
            if (!diagramRef.current) return;
            try {
                setError(null);
                const { svg } = await mermaid.render(uniqueId, code);
                if (diagramRef.current) {
                    diagramRef.current.innerHTML = svg;
                }
            } catch (e: any) {
                console.error("Mermaid rendering error:", e);
                setError(e.message || "An error occurred while rendering the diagram.");
            }
        };
        render();
    }, [code, uniqueId]);
    
    const handleZoom = useCallback((delta: number, clientX?: number, clientY?: number) => {
        setTransform(prev => {
            const newScale = Math.max(0.1, Math.min(10, prev.scale - delta * 0.01));
            let newPosX = prev.posX;
            let newPosY = prev.posY;
    
            if (clientX !== undefined && clientY !== undefined && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = clientX - rect.left;
                const mouseY = clientY - rect.top;
    
                newPosX = mouseX - (mouseX - prev.posX) * (newScale / prev.scale);
                newPosY = mouseY - (mouseY - prev.posY) * (newScale / prev.scale);
            }
    
            return { scale: newScale, posX: newPosX, posY: newPosY };
        });
    }, []);

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        handleZoom(e.deltaY, e.clientX, e.clientY);
    }, [handleZoom]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        panState.current = { isPanning: true, startX: e.clientX - transform.posX, startY: e.clientY - transform.posY };
    }, [transform]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!panState.current.isPanning) return;
        setTransform(prev => ({ ...prev, posX: e.clientX - panState.current.startX, posY: e.clientY - panState.current.startY }));
    }, []);
    
    const handleMouseUp = useCallback(() => {
        panState.current.isPanning = false;
    }, []);

    const getTouchDist = (e: TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    
    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (e.touches.length === 2) {
            pinchState.current.initialDist = getTouchDist(e);
        } else if (e.touches.length === 1) {
             panState.current = { isPanning: true, startX: e.touches[0].clientX - transform.posX, startY: e.touches[0].clientY - transform.posY };
        }
    }, [transform.posX, transform.posY]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 2) {
            const newDist = getTouchDist(e);
            const delta = (pinchState.current.initialDist - newDist) * 0.5;
            handleZoom(delta);
            pinchState.current.initialDist = newDist;
        } else if (e.touches.length === 1 && panState.current.isPanning) {
            setTransform(prev => ({...prev, posX: e.touches[0].clientX - panState.current.startX, posY: e.touches[0].clientY - panState.current.startY}));
        }
    }, [handleZoom]);

    const handleTouchEnd = useCallback(() => {
        panState.current.isPanning = false;
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        container.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        
        return () => {
            container.removeEventListener('wheel', handleWheel);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleWheel, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col p-4" dir="ltr">
             <div ref={containerRef} onMouseDown={handleMouseDown} className="flex-1 w-full h-full rounded-lg overflow-hidden cursor-grab active:cursor-grabbing grid-background">
                 <div ref={diagramRef} style={{ transform: `translate(${transform.posX}px, ${transform.posY}px) scale(${transform.scale})`, transformOrigin: '0 0' }} className="w-full h-full flex justify-center items-center" />
             </div>
             <div className="absolute top-6 right-6 flex items-center gap-2">
                 <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md p-1 rounded-full">
                     <button onClick={() => handleZoom(-20)} className="p-2 rounded-full text-white hover:bg-white/20" aria-label="تكبير"><ZoomInIcon className="w-5 h-5" /></button>
                     <button onClick={() => handleZoom(20)} className="p-2 rounded-full text-white hover:bg-white/20" aria-label="تصغير"><ZoomOutIcon className="w-5 h-5" /></button>
                     <button onClick={() => setTransform({ scale: 1, posX: 0, posY: 0 })} className="p-2 rounded-full text-white hover:bg-white/20" aria-label="إعادة تعيين"><RefreshCwIcon className="w-5 h-5" /></button>
                 </div>
                 <button onClick={onClose} className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30" aria-label="إغلاق"><XIcon className="w-6 h-6" /></button>
             </div>
        </div>
    );
};


const ChartDisplay: React.FC<{ chartData: ChartData }> = ({ chartData }) => {
    const renderChart = () => {
        switch(chartData.type) {
            case 'bar':
                return <Bar options={chartData.options} data={chartData.data} />;
            case 'line':
                return <Line options={chartData.options} data={chartData.data} />;
            case 'pie':
                return <Pie options={chartData.options} data={chartData.data} />;
            default:
                return <p>نوع مخطط غير معروف.</p>;
        }
    };

    return (
        <div className="my-4 p-4 bg-[var(--token-main-surface-primary)] rounded-xl border border-[var(--token-border-default)]">
            {renderChart()}
        </div>
    );
};

const DeepThinkingDisplay: React.FC<{ deepThinking: DeepThinking | null }> = ({ deepThinking }) => {
    const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed

    if (!deepThinking) return null;

    const formatDuration = (ms: number) => (ms / 1000).toFixed(1) + ' ث';

    if (!isExpanded) {
        return (
            <div className="my-4">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full flex items-center justify-between p-2 pl-3 pr-4 rounded-full bg-gradient-to-br from-blue-500/5 to-blue-500/10 dark:from-blue-900/20 dark:to-blue-900/30 border border-blue-500/30 hover:bg-blue-500/20 transition-all duration-200"
                    aria-label="إظهار تفاصيل التفكير العميق"
                >
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <img src="https://static.deepseek.com/chat/static/thinkIconDark.e31b2b1fcf.png" alt="Deep Thinking" className="w-5 h-5" />
                        </div>
                        <h4 className="font-semibold text-blue-600 dark:text-blue-300">
                            التفكير العميق
                        </h4>
                    </div>
                    <ChevronDownIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </button>
            </div>
        );
    }

    return (
        <div className="border border-blue-500/30 rounded-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10 dark:from-blue-900/20 dark:to-blue-900/30 p-4 my-4 animate-fade-in">
            <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 animate-icon-glow">
                    <img src="https://static.deepseek.com/chat/static/thinkIconDark.e31b2b1fcf.png" alt="Deep Thinking" className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-300">
                        التفكير العميق
                        {deepThinking.duration && (
                            <span className="text-xs font-normal text-[var(--token-text-tertiary)] mr-2">
                                (استغرق {formatDuration(deepThinking.duration)})
                            </span>
                        )}
                    </h4>
                    <p className="text-sm text-[var(--token-text-secondary)] mt-1 whitespace-pre-wrap">{deepThinking.method}</p>
                </div>
                 <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 rounded-full hover:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    aria-label="إخفاء تفاصيل التفكير العميق"
                >
                    <ChevronUpIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-500/20">
                <h5 className="font-semibold text-sm text-[var(--token-text-primary)] mb-2">خطة العمل:</h5>
                <ol className="relative border-r border-dashed border-blue-400/50 dark:border-blue-500/40 mr-3">
                    {deepThinking.plan.map((step, index) => (
                        <li key={index} className="mb-4 mr-6 animate-fade-in" style={{ animationDelay: `${index * 100}ms`}}>
                            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -right-3 ring-4 ring-white dark:ring-blue-900/30 dark:bg-blue-900">
                                <CheckCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </span>
                            <p className="text-sm text-[var(--token-text-secondary)]">{step}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
};

const ResearchPlanDisplay: React.FC<{
    messageId: string;
    plan: string[];
    isExecuted: boolean;
    onExecute: (messageId: string, plan: string[]) => void;
}> = ({ messageId, plan, isExecuted, onExecute }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedPlan, setEditedPlan] = useState(plan);

    const handleUpdateStep = (index: number, value: string) => {
        setEditedPlan(current => current.map((step, i) => i === index ? value : step));
    };

    const handleAddStep = () => {
        setEditedPlan(current => [...current, '']);
    };

    const handleRemoveStep = (index: number) => {
        setEditedPlan(current => current.filter((_, i) => i !== index));
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedPlan(plan);
    };

    const handleExecuteEditedPlan = () => {
        const finalPlan = editedPlan.map(s => s.trim()).filter(Boolean);
        if (finalPlan.length > 0) {
            onExecute(messageId, finalPlan);
            setIsEditing(false);
        } else {
            alert("لا يمكن تنفيذ خطة فارغة.");
        }
    };

    if (isExecuted) {
        return (
            <div className="border border-gray-500/30 rounded-lg bg-gray-500/10 dark:bg-gray-900/20 p-4 my-4 opacity-70">
                <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-gray-400" />
                    <h4 className="font-semibold text-gray-600 dark:text-gray-300">تم تنفيذ خطة البحث</h4>
                </div>
                <ul className="mt-4 list-decimal list-inside space-y-2 text-[var(--token-text-secondary)]">
                    {plan.map((step, index) => <li key={index} className="line-through">{step}</li>)}
                </ul>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="border border-blue-500/30 rounded-lg bg-blue-500/10 dark:bg-blue-900/20 p-4 my-4">
                <h4 className="font-semibold text-blue-600 dark:text-blue-300 mb-3 text-lg">تعديل خطة البحث</h4>
                <div className="space-y-2">
                    {editedPlan.map((step, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={step}
                                onChange={e => handleUpdateStep(index, e.target.value)}
                                placeholder="اكتب خطوة البحث هنا..."
                                className="w-full bg-white/50 dark:bg-black/20 border border-blue-300/50 dark:border-blue-600/50 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={() => handleRemoveStep(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full flex-shrink-0" aria-label="إزالة الخطوة">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddStep} className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mt-3 p-2 hover:bg-blue-500/10 rounded-lg font-semibold">
                    <PlusIcon className="w-4 h-4" /> إضافة خطوة
                </button>
                <div className="mt-6 flex gap-4">
                    <button onClick={handleExecuteEditedPlan} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                        حفظ وتنفيذ البحث
                    </button>
                    <button onClick={handleCancelEdit} className="px-4 py-2 bg-[var(--token-main-surface-tertiary)] text-[var(--token-text-primary)] font-medium rounded-lg hover:bg-[var(--token-border-default)] transition-colors">
                        إلغاء
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-green-500/30 rounded-lg bg-green-500/10 dark:bg-green-900/20 p-4 my-4">
            <div className="flex items-center gap-3">
                <GlobeIcon className="w-6 h-6 text-green-400" />
                <h4 className="font-semibold text-green-600 dark:text-green-300 text-lg">خطة البحث المقترحة</h4>
            </div>
            <ul className="mt-4 list-decimal list-inside space-y-2 text-[var(--token-text-secondary)]">
                {plan.map((step, index) => <li key={index}>{step}</li>)}
            </ul>
            <div className="mt-6 flex gap-4">
                <button onClick={() => onExecute(messageId, plan)} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                    ابدأ البحث
                </button>
                 <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--token-main-surface-tertiary)] text-[var(--token-text-primary)] font-medium rounded-lg hover:bg-[var(--token-border-default)] transition-colors">
                    <EditIcon className="w-4 h-4" /> تعديل الخطة
                </button>
            </div>
        </div>
    );
};


const SourceLink: React.FC<{ source: Source; index: number }> = ({ source, index }) => {
    const [faviconError, setFaviconError] = useState(false);
    const placeholderIcon = <GlobeIcon className="w-4 h-4 text-[var(--token-icon-secondary)]" />;

    // The Gemini search grounding API returns redirect URLs (e.g., vertexaisearch.cloud.google.com...).
    // The actual domain of the source is reliably provided in the `title` field.
    // Therefore, we use `source.title` to fetch the favicon.
    const domain = source.title;
    const faviconUrl = domain ? `https://s2.googleusercontent.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : '';
    
    const displayText = source.title || new URL(source.uri).hostname;

    return (
        <a
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs bg-[var(--token-main-surface-tertiary)] hover:bg-[var(--token-border-default)] text-blue-600 dark:text-blue-400 pl-2 pr-3 py-1 rounded-full transition-colors truncate max-w-xs"
            title={source.uri}
        >
            {faviconError || !domain ? (
                placeholderIcon
            ) : (
                <img
                    src={faviconUrl}
                    alt={`Favicon for ${domain}`}
                    className="w-4 h-4"
                    onError={() => setFaviconError(true)}
                />
            )}
            <span>{`${index + 1}. ${displayText}`}</span>
        </a>
    );
};


const SourcesDisplay: React.FC<{ sources: Message['sources'] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t border-[var(--token-border-default)]">
      <h5 className="font-semibold mb-2 text-sm text-[var(--token-text-secondary)]">المصادر:</h5>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <SourceLink key={index} source={source} index={index} />
        ))}
      </div>
    </div>
  );
};

const QrCodeDisplay: React.FC<{ svg: string }> = ({ svg }) => {
    const handleDownload = () => {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'qrcode.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="my-4 p-4 bg-[var(--token-main-surface-primary)] rounded-xl border border-[var(--token-border-default)] flex flex-col items-center gap-4">
            <div className="p-2 bg-white rounded-lg" dangerouslySetInnerHTML={{ __html: svg }} />
            <button onClick={handleDownload} className="flex items-center gap-2 text-sm px-4 py-2 bg-[var(--token-main-surface-tertiary)] hover:bg-[var(--token-border-default)] rounded-lg font-semibold">
                <DownloadIcon className="w-4 h-4" />
                تحميل
            </button>
        </div>
    );
};


interface MessageRendererProps {
  message: Message;
  onExecuteResearch?: (messageId: string, plan: string[]) => void;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onForward?: (content: string) => void;
  isStreaming?: boolean;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({ message, onExecuteResearch, editingMessageId, setEditingMessageId, onEditMessage, onForward, isStreaming }) => {
  const [editedContent, setEditedContent] = useState(message.content);
  const [isCopied, setIsCopied] = useState(false);

  const handleSaveEdit = () => {
      onEditMessage(message.id, editedContent);
      setEditingMessageId(null);
  };

  const handleCancelEdit = () => {
      setEditedContent(message.content);
      setEditingMessageId(null);
  };
  
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (message.role === 'user') {
    if (editingMessageId === message.id) {
        return (
            <div className="flex justify-end">
                <div className="w-full max-w-2xl bg-[var(--token-interactive-bg-primary-container)] rounded-[20px] p-3 shadow-lg">
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full bg-sky-900/50 text-sky-100 rounded-lg p-2 text-sm border-sky-600/80 focus:ring-sky-500 focus:border-sky-500 resize-none"
                        rows={Math.max(3, editedContent.split('\n').length)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={handleCancelEdit} className="px-3 py-1 text-xs text-gray-200 hover:bg-white/10 rounded-md transition-colors">إلغاء</button>
                        <button onClick={handleSaveEdit} className="px-4 py-1 text-xs bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-200 transition-colors">حفظ وإرسال</button>
                    </div>
                </div>
            </div>
        );
    }
      
    const canEdit = !message.attachments || message.attachments.length === 0;

    return (
      <div className="group flex justify-end">
        <div className="max-w-2xl bg-[var(--token-interactive-bg-primary-container)] text-[var(--token-on-primary-container)] rounded-[20px] rounded-br-lg px-4 py-3 relative">
            <div className="absolute top-1 left-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                {onForward && (
                    <button
                        onClick={() => onForward(message.content)}
                        className="p-1.5 rounded-full bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/20"
                        aria-label="إعادة توجيه الرسالة"
                    >
                        <ShareIcon className="w-3.5 h-3.5" />
                    </button>
                )}
                 {canEdit && (
                    <button
                        onClick={() => {
                            setEditedContent(message.content);
                            setEditingMessageId(message.id);
                        }}
                        className="p-1.5 rounded-full bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/20"
                        aria-label="تعديل الرسالة"
                    >
                        <EditIcon className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            {message.attachments && message.attachments.length > 0 && (
                <div className="mb-2 pb-2 border-b border-black/10 dark:border-white/20">
                    <div className="flex flex-wrap gap-2">
                        {message.attachments.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 bg-black/10 dark:bg-white/10 text-xs px-2 py-1 rounded-full">
                                {file.name.startsWith('drawing-') ? (
                                    <PaletteIcon className="w-3 h-3" />
                                ) : file.mimeType.startsWith('image/') ? (
                                    <ImagePlaceholderIcon className="w-3 h-3" />
                                ) : file.mimeType.startsWith('audio/') ? (
                                    <MusicIcon className="w-3 h-3" />
                                ) : (
                                    <FileTextIcon className="w-3 h-3" />
                                )}
                                <span>{file.name.startsWith('drawing-') ? 'رسم' : file.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative w-full max-w-4xl">
       <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 z-10">
          <button
              onClick={handleCopyMessage}
              className="p-1.5 rounded-full text-[var(--token-icon-secondary)] bg-[var(--token-main-surface-primary)] hover:bg-[var(--token-main-surface-tertiary)]"
              aria-label="نسخ الرسالة"
          >
              {isCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
          </button>
      </div>
      <div className="prose prose-sm md:prose-base max-w-none prose-p:text-[var(--token-text-secondary)] prose-headings:text-[var(--token-text-primary)] prose-strong:text-[var(--token-text-primary)] prose-li:text-[var(--token-text-secondary)] prose-blockquote:text-[var(--token-text-tertiary)] prose-table:text-[var(--token-text-secondary)] prose-th:text-[var(--token-text-primary)]">
        {message.deepThinking && <DeepThinkingDisplay deepThinking={message.deepThinking} />}
        {message.researchPlan && onExecuteResearch && (
          <ResearchPlanDisplay
            messageId={message.id}
            plan={message.researchPlan}
            isExecuted={!!message.isPlanExecuted}
            onExecute={onExecuteResearch}
          />
        )}
         {message.qrCodeSVG && <QrCodeDisplay svg={message.qrCodeSVG} />}
         {message.mermaidCodes && message.mermaidCodes.map((code, index) => <MermaidDiagram key={index} code={code} />)}
         {message.chartData && <ChartDisplay chartData={message.chartData} />}
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return <CodeBlock language={match ? match[1] : undefined} inline={inline} {...props}>{children}</CodeBlock>
            },
            quran: ({node, ...props}) => <span className="font-quran text-lg leading-loose text-[var(--token-quran-text)]" {...props} />
          } as any}
        >
          {message.content}
        </ReactMarkdown>
         {isStreaming && <TypingCursor />}
      </div>
       {(message.sources || message.designContent) && (
        <div className="mt-4 pt-3 border-t border-[var(--token-border-default)] space-y-3">
          {message.designContent && (
              <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                  <LayoutIcon className="w-4 h-4" />
                  <span>تم إنشاء معاينة تصميم.</span>
              </div>
          )}
          {message.sources && <SourcesDisplay sources={message.sources} />}
        </div>
      )}
    </div>
  );
};
