import React, { useState, useEffect, useId, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import {
    ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon, WhiteboardIcon,
    FileTextIcon, AtomIcon, LayoutIcon, ImagePlaceholderIcon, CodeIcon, FeatherIcon, MaximizeIcon, XIcon,
    PlayIcon, PauseIcon, LoaderIcon
} from './Icons';
import type { WhiteboardStep } from '../types';

interface WhiteboardProps {
    steps: WhiteboardStep[];
}

const ImageLightbox: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white bg-black/20 rounded-full hover:bg-black/40 transition-colors z-10">
                <XIcon className="w-6 h-6" />
            </button>
            <img src={src} alt="Enlarged view" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
        </div>
    );
};

const StepRenderer: React.FC<{ step: WhiteboardStep }> = ({ step }) => {
    const uniqueId = useId();
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    useEffect(() => {
        if (step.type === 'mermaid') {
            const container = document.getElementById(uniqueId);
            if (container) {
                try {
                    mermaid.render(uniqueId + '-svg', step.content).then(({ svg }) => {
                        container.innerHTML = svg;
                    });
                } catch (e) {
                    console.error("Mermaid render error in whiteboard", e);
                    if(container) container.innerHTML = `<p class="text-red-500">خطأ في عرض المخطط.</p>`;
                }
            }
        }
    }, [step, uniqueId]);

    switch (step.type) {
        case 'html':
            return <div className="prose-styles-reset" dangerouslySetInnerHTML={{ __html: step.content }} />;
        case 'text':
        case 'latex':
            return (
                <ReactMarkdown
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    remarkPlugins={[remarkGfm, remarkMath]}
                >
                    {step.type === 'latex' ? `$$${step.content}$$` : step.content}
                </ReactMarkdown>
            );
        case 'mermaid':
            return <div id={uniqueId} className="w-full flex justify-center items-center my-4"></div>;
        case 'svg':
            return <div dangerouslySetInnerHTML={{ __html: step.content }} className="w-full flex justify-center items-center my-4" />;
        case 'image':
            return (
                <>
                    <button onClick={() => setLightboxSrc(step.content)} className="w-full h-full flex justify-center items-center my-4 group relative">
                        <img src={step.content} alt="Illustration" className="max-w-full max-h-[20rem] mx-auto rounded-lg shadow-md object-contain transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <MaximizeIcon className="w-8 h-8 text-white" />
                        </div>
                    </button>
                    {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
                </>
            );
        case 'image_loading':
            return (
                <div className="w-full h-64 flex flex-col justify-center items-center my-4 bg-[var(--token-main-surface-tertiary)] rounded-lg p-4">
                    <LoaderIcon className="w-8 h-8 animate-spin text-[var(--token-text-secondary)] mb-4" />
                    <p className="text-sm text-[var(--token-text-secondary)]">جارٍ إنشاء صورة...</p>
                    <p className="text-xs text-center text-[var(--token-text-tertiary)] mt-2 italic">"{step.content}"</p>
                </div>
            );
        default:
            return <p>نوع محتوى غير معروف.</p>;
    }
};

export const Whiteboard: React.FC<WhiteboardProps> = ({ steps }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const timerRef = useRef<number | null>(null);
    const stepStartTimeRef = useRef<number>(0);

    const calculateStepDuration = (step: WhiteboardStep) => {
        switch (step.type) {
            case 'text':
                return Math.max(3000, step.content.length * 80); // 80ms per char, min 3s
            case 'image':
            case 'svg':
            case 'mermaid':
                return 5000; // 5s for visuals
            case 'latex':
            case 'html':
                return 4000; // 4s for complex content
            case 'image_loading':
                return 1000; // a short time, playback will pause anyway until loaded
            default:
                return 3000;
        }
    };

    useEffect(() => {
        setCurrentStepIndex(0);
        setIsPlaying(false);
    }, [steps]);

    useEffect(() => {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        
        const currentStep = steps[currentStepIndex];
        if (!currentStep) return;

        // Pause playback if an image is still generating
        if (isPlaying && currentStep.type === 'image_loading') {
            setIsPlaying(false);
            return;
        }

        if (isPlaying && currentStepIndex < steps.length - 1) {
            const duration = calculateStepDuration(currentStep);
            stepStartTimeRef.current = Date.now();

            const updateProgress = () => {
                const elapsedTime = Date.now() - stepStartTimeRef.current;
                const currentProgress = Math.min(100, (elapsedTime / duration) * 100);
                setProgress(currentProgress);
                if (elapsedTime < duration) {
                    timerRef.current = requestAnimationFrame(updateProgress);
                }
            };
            timerRef.current = requestAnimationFrame(updateProgress);

            const timeoutId = setTimeout(() => {
                setCurrentStepIndex(i => i + 1);
            }, duration);

            return () => {
                clearTimeout(timeoutId);
                if (timerRef.current) cancelAnimationFrame(timerRef.current);
            };
        } else {
            if (isPlaying && currentStepIndex === steps.length - 1) {
                setIsPlaying(false);
                setProgress(100); // Show full progress on last step
                setTimeout(() => setProgress(0), 500);
            } else {
                setProgress(0);
            }
        }
    }, [isPlaying, currentStepIndex, steps]);
    
    const manualSetStep = (index: number) => {
        setIsPlaying(false);
        setCurrentStepIndex(index);
    };
    
    const togglePlay = () => {
        if (!isPlaying && currentStepIndex === steps.length - 1) {
            setCurrentStepIndex(0);
        }
        setIsPlaying(!isPlaying);
    };

    const restart = () => {
        setIsPlaying(false);
        setCurrentStepIndex(0);
    };

    const getStepIcon = (type: WhiteboardStep['type']) => {
        switch(type) {
            case 'text': return <FileTextIcon className="w-5 h-5" />;
            case 'latex': return <AtomIcon className="w-5 h-5" />;
            case 'mermaid': return <LayoutIcon className="w-5 h-5" />;
            case 'html': return <CodeIcon className="w-5 h-5" />;
            case 'image': return <ImagePlaceholderIcon className="w-5 h-5" />;
            case 'generate_image':
            case 'image_loading': return <LoaderIcon className="w-5 h-5 animate-spin" />;
            case 'svg': return <FeatherIcon className="w-5 h-5" />;
            default: return null;
        }
    };

    if (steps.length === 0) {
        return (
             <div className="bg-white dark:bg-[#282c34] rounded-xl border border-[var(--token-border-default)] flex flex-col h-full overflow-hidden items-center justify-center text-center p-4 whiteboard-pattern">
                 <WhiteboardIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                 <h3 className="font-bold text-lg text-[var(--token-text-primary)]">السبورة الرقمية</h3>
                 <p className="text-sm text-[var(--token-text-secondary)] max-w-xs">
                     اطلب من الأستاذ شرحًا يتضمن معادلات، صورًا، أو رسومًا بيانية، وستظهر هنا خطوة بخطوة.
                 </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#282c34] rounded-xl border border-[var(--token-border-default)] flex flex-col h-full overflow-hidden whiteboard-pattern">
            <div className="flex-1 p-6 overflow-y-auto prose prose-sm max-w-none prose-p:text-[var(--token-text-secondary)] prose-headings:text-[var(--token-text-primary)] prose-strong:text-[var(--token-text-primary)] prose-li:text-[var(--token-text-secondary)]">
                <style>{`.prose-styles-reset table, .prose-styles-reset tr, .prose-styles-reset td { all: revert; }`}</style>
                <div key={currentStepIndex} className="animate-fade-in">
                    {steps[currentStepIndex] && <StepRenderer step={steps[currentStepIndex]} />}
                </div>
            </div>
            
            <div className="p-2 border-t border-[var(--token-border-default)] bg-white/70 dark:bg-[#282c34]/70 backdrop-blur-sm flex-shrink-0">
                 <div className="w-full bg-gray-300/50 dark:bg-gray-700/50 rounded-full h-1 my-2">
                    <div className="bg-[var(--token-interactive-bg-primary)] h-1 rounded-full" style={{ width: `${progress}%`, transition: progress > 0 ? 'width 0.1s linear' : 'none' }}></div>
                </div>

                 <div className="flex items-center justify-between">
                     <div className="flex items-center gap-1">
                        <button onClick={togglePlay} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--token-main-surface-tertiary)]" aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}>
                            {isPlaying ? <PauseIcon className="w-5 h-5"/> : <PlayIcon className="w-5 h-5"/>}
                        </button>
                        <button onClick={restart} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--token-main-surface-tertiary)]" aria-label="إعادة"><RefreshCwIcon className="w-5 h-5" /></button>
                     </div>
                    <div className="flex items-center gap-4">
                         <button onClick={() => manualSetStep(Math.max(0, currentStepIndex - 1))} disabled={currentStepIndex === 0} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)] disabled:opacity-30"><ChevronRightIcon className="w-5 h-5" /></button>
                         <span className="text-sm font-semibold font-mono tabular-nums">
                            {currentStepIndex + 1} / {steps.length}
                        </span>
                         <button onClick={() => manualSetStep(Math.min(steps.length - 1, currentStepIndex + 1))} disabled={currentStepIndex === steps.length - 1} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)] disabled:opacity-30"><ChevronLeftIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="w-20"></div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto p-2 filmstrip-scrollbar">
                     {steps.map((step, index) => (
                        <button 
                            key={index} 
                            onClick={() => manualSetStep(index)}
                            className={`w-14 h-14 flex-shrink-0 rounded-lg flex items-center justify-center transition-all border-2 ${currentStepIndex === index ? 'border-[var(--token-interactive-bg-primary)] scale-110 bg-white dark:bg-gray-700' : 'border-transparent bg-[var(--token-main-surface-tertiary)] hover:border-[var(--token-border-default)]'}`}
                            title={`الخطوة ${index + 1}: ${step.type}`}
                        >
                            <span className={currentStepIndex === index ? 'text-[var(--token-interactive-bg-primary)]' : 'text-[var(--token-icon-secondary)]'}>
                                {getStepIcon(step.type)}
                            </span>
                        </button>
                     ))}
                </div>
            </div>
        </div>
    );
};