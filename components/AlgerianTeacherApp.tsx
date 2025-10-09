import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, BookIcon, FileTextIcon, MessageSquareIcon, GlobeIcon, ChevronRightIcon, ChevronLeftIcon, LoaderIcon, WhiteboardIcon, CalculatorIcon } from './Icons';
import { ChatView } from './ChatView';
import { ALGERIAN_TEACHER_RESOURCES } from '../data/teacherResources';
import { ModelId, Message, WhiteboardStep } from '../types';
import { Whiteboard } from './Whiteboard';
import { GradeCalculator } from './GradeCalculator';

interface AlgerianTeacherAppProps {
    onBack: () => void;
}

const Splash: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const sequence = [
            2000, // Show logo + titles
            2000, // Show "welcome"
            2000, // Show "good luck"
            500   // Fade out to main app
        ];

        if (step < sequence.length) {
            const timer = setTimeout(() => setStep(s => s + 1), sequence[step]);
            return () => clearTimeout(timer);
        } else {
            onFinished();
        }
    }, [step, onFinished]);

    return (
        <div className="absolute inset-0 bg-[var(--token-main-surface-primary)] flex flex-col justify-center items-center text-center transition-opacity duration-500" style={{ opacity: step === 3 ? 0 : 1 }}>
            <div className={`transition-opacity duration-500 ${step === 0 ? 'opacity-100' : 'opacity-0'}`}>
                <img src="https://i.postimg.cc/8PnWVyML/Chat-GPT-Image-22-2025-11-03-34.png" alt="Algerian Teacher App Icon" className="w-32 h-32 mx-auto rounded-full" />
                <h1 className="text-3xl font-bold mt-4 text-[var(--token-text-primary)]">الأستاذ الجزائري</h1>
                <p className="text-lg text-[var(--token-text-secondary)]">السنة الرابعة متوسط</p>
            </div>
            <p className={`absolute text-2xl font-semibold transition-opacity duration-500 ${step === 1 ? 'opacity-100' : 'opacity-0'}`}>مرحبا بكم في تطبيق الأستاذ الجزائري</p>
            <p className={`absolute text-2xl font-semibold transition-opacity duration-500 ${step === 2 ? 'opacity-100' : 'opacity-0'}`}>نتمنى لكم النجاح والتوفيق</p>
        </div>
    );
};

const ExamCountdown: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isExamTime, setIsExamTime] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            let year = now.getFullYear();
            
            const examStartDate = new Date(year, 5, 1); // June 1st
            const examEndDate = new Date(year, 5, 4); // End of June 3rd (day starts at 0, so 4 is correct for including all of 3rd)

            let targetDate = examStartDate;

            if (now > examEndDate) {
                targetDate = new Date(year + 1, 5, 1);
            }

            if (now >= examStartDate && now < examEndDate) {
                setIsExamTime(true);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }
            setIsExamTime(false);

            const difference = targetDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                 setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const TimeBox: React.FC<{ value: number; label: string }> = ({ value, label }) => (
        <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm p-3 rounded-2xl min-w-[70px] md:min-w-[80px]">
            <span className="text-3xl md:text-4xl font-bold text-white">{value.toString().padStart(2, '0')}</span>
            <span className="text-xs text-white/80 uppercase tracking-wider">{label}</span>
        </div>
    );

    if (isExamTime) {
         return (
            <div className="text-center my-6 p-4 bg-green-500/80 rounded-2xl shadow-lg animate-fade-in">
                <h2 className="text-2xl font-bold text-white">فترة الإختبار جارية حاليا</h2>
                <p className="text-white/90">بالتوفيق لجميع التلاميذ!</p>
            </div>
        );
    }

    return (
        <div className="text-center my-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-white mb-3" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                العد التنازلي لامتحان شهادة التعليم المتوسط
            </h2>
            <div className="flex justify-center items-center gap-2 md:gap-4 flex-wrap">
                <TimeBox value={timeLeft.days} label="يوم" />
                <TimeBox value={timeLeft.hours} label="ساعة" />
                <TimeBox value={timeLeft.minutes} label="دقيقة" />
                <TimeBox value={timeLeft.seconds} label="ثانية" />
            </div>
        </div>
    );
};

const ResourcePage: React.FC<{ title: string; resources: any; onBack: () => void; }> = ({ title, resources, onBack }) => {
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedResource, setSelectedResource] = useState<{title: string, url: string} | null>(null);

    const handleSelectResource = (url: string, title: string) => {
        setSelectedResource({ url, title });
    };

    if (selectedResource) {
        return (
            <div className="h-full flex flex-col">
                <header className="p-2 flex items-center gap-2 border-b border-[var(--token-border-default)] flex-shrink-0 bg-[var(--token-main-surface-primary)]">
                    <button onClick={() => setSelectedResource(null)} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                    <h3 className="font-semibold truncate">{selectedResource.title}</h3>
                </header>
                <iframe src={selectedResource.url.replace('/view', '/preview')} className="w-full h-full border-0" />
            </div>
        );
    }

    if (selectedSubject) {
        const subjectResources = resources.subjects[selectedSubject];
        return (
             <div className="h-full flex flex-col bg-[var(--token-surface-container)]">
                 <header className="p-2 flex items-center gap-2 border-b border-[var(--token-border-default)] flex-shrink-0 bg-[var(--token-main-surface-primary)]">
                    <button onClick={() => setSelectedSubject(null)} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                    <h3 className="font-bold text-lg">{selectedSubject}</h3>
                </header>
                <div className="p-4 overflow-y-auto">
                    {Array.isArray(subjectResources) ? (
                        <div className="space-y-2">
                           {subjectResources.map((item: any, index: number) => (
                               <button key={index} onClick={() => handleSelectResource(item.url, item.title)} className="w-full text-right p-4 bg-[var(--token-main-surface-secondary)] rounded-xl hover:bg-[var(--token-main-surface-tertiary)] transition-colors flex justify-between items-center">
                                   <span>{item.title}</span>
                                   <ChevronLeftIcon className="w-5 h-5 text-[var(--token-on-surface-variant)]" />
                               </button>
                           ))}
                        </div>
                    ) : (
                        <p className="p-4 text-center text-[var(--token-text-tertiary)]">{subjectResources}</p>
                    )}
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full flex flex-col bg-[var(--token-surface-container)]">
            <header className="p-2 flex items-center gap-2 border-b border-[var(--token-border-default)] flex-shrink-0 bg-[var(--token-main-surface-primary)]">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                <h2 className="font-bold text-xl">{title}</h2>
            </header>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto">
                {Object.keys(resources.subjects).map(subject => (
                    <button key={subject} onClick={() => setSelectedSubject(subject)} className="p-4 aspect-square flex flex-col justify-center items-center gap-2 bg-[var(--token-surface-container-high)] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                        <span className="text-lg font-semibold text-center">{subject}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const EDUCATIONAL_WEBSITES = [
    { title: "موقع ديزاد اكزام", url: "https://www.dzexams.com/" },
    { title: "موقع تسنيم للتربية والتعليم", url: "https://www.t-onec.com/" },
    { title: "موقع الدراسة الجزائري", url: "https://eddirasa.com/" },
    { title: "موقع التربية والتعليم", url: "https://www.edu-dz.com/" },
    { title: "موقع التعليم الجزائري", url: "https://www.dzetude.com/" },
    { title: "موقع التعليم الجزائري 2", url: "https://educationdz.com" }
];

const WebsiteViewerPage: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    const [selectedWebsite, setSelectedWebsite] = useState<{title: string, url: string} | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const WebsiteButton: React.FC<{ website: {title: string, url: string}, onClick: () => void }> = ({ website, onClick }) => {
        const [faviconError, setFaviconError] = useState(false);
        const domain = new URL(website.url).hostname;
        const faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

        return (
            <button onClick={onClick} className="p-4 aspect-[4/3] flex flex-col justify-center items-center gap-3 bg-[var(--token-surface-container-high)] rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                {faviconError ? (
                    <GlobeIcon className="w-10 h-10 text-[var(--token-icon-tertiary)]" />
                ) : (
                    <img
                        src={faviconUrl}
                        alt=""
                        className="w-10 h-10"
                        onError={() => setFaviconError(true)}
                    />
                )}
                <span className="text-base font-semibold text-center">{website.title}</span>
            </button>
        );
    };

    const handleGoBack = () => {
        iframeRef.current?.contentWindow?.history.back();
    };

    const handleGoForward = () => {
        iframeRef.current?.contentWindow?.history.forward();
    };

    if (selectedWebsite) {
        return (
            <div className="h-full flex flex-col bg-[var(--token-main-surface-primary)]">
                <header className="p-2 flex items-center justify-between gap-2 border-b border-[var(--token-border-default)] flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <button onClick={() => { setSelectedWebsite(null); setIsLoading(true); }} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)] flex-shrink-0"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                        <h3 className="font-semibold truncate">{selectedWebsite.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                         <button onClick={handleGoBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]" aria-label="للخلف"><ChevronRightIcon className="w-5 h-5" /></button>
                         <button onClick={handleGoForward} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]" aria-label="للأمام"><ChevronLeftIcon className="w-5 h-5" /></button>
                        <a href={selectedWebsite.url} target="_blank" rel="noopener noreferrer" className="text-sm px-3 py-1.5 bg-[var(--token-main-surface-tertiary)] rounded-full hover:bg-[var(--token-border-default)] flex-shrink-0">
                            فتح
                        </a>
                    </div>
                </header>
                <div className="relative flex-1 bg-[var(--token-main-surface-secondary)]">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <LoaderIcon className="w-8 h-8 animate-spin text-[var(--token-text-tertiary)]" />
                        </div>
                    )}
                    <iframe 
                        ref={iframeRef} 
                        src={selectedWebsite.url} 
                        title={selectedWebsite.title} 
                        className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        sandbox="allow-scripts allow-same-origin"
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[var(--token-surface-container)]">
            <header className="p-2 flex items-center gap-2 border-b border-[var(--token-border-default)] flex-shrink-0 bg-[var(--token-main-surface-primary)]">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                <h2 className="font-bold text-xl">مواقع تعليمية موثوقة</h2>
            </header>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto">
                {EDUCATIONAL_WEBSITES.map(website => (
                    <WebsiteButton key={website.title} website={website} onClick={() => setSelectedWebsite(website)} />
                ))}
            </div>
        </div>
    );
};

const ChatWithWhiteboard: React.FC<{onBack: () => void}> = ({onBack}) => {
    const [whiteboardSteps, setWhiteboardSteps] = useState<WhiteboardStep[]>([]);
    const [mobileView, setMobileView] = useState<'chat' | 'whiteboard'>('chat');
    
    const isWhiteboardActive = whiteboardSteps.length > 0;

    const handleNewMessages = (messages: Message[]) => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage.whiteboardSteps) {
            setWhiteboardSteps(lastMessage.whiteboardSteps);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[var(--token-main-surface-primary)]">
            <header className="p-2 flex items-center justify-between gap-2 border-b border-[var(--token-border-default)] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                    <h2 className="font-bold text-xl">الأستاذ</h2>
                </div>
                 <div className="md:hidden">
                    {isWhiteboardActive && (
                        <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--token-surface-container)]">
                             <button onClick={() => setMobileView('chat')} className={`px-3 py-1 text-sm rounded-full ${mobileView === 'chat' ? 'bg-[var(--token-surface-container-highest)] shadow' : ''}`}>محادثة</button>
                             <button onClick={() => setMobileView('whiteboard')} className={`px-3 py-1 text-sm rounded-full ${mobileView === 'whiteboard' ? 'bg-[var(--token-surface-container-highest)] shadow' : ''}`}>سبورة</button>
                        </div>
                    )}
                </div>
            </header>
            <div className="flex-1 min-h-0 md:grid md:grid-cols-2 md:gap-4 md:p-4">
                <div className={`${mobileView === 'whiteboard' && isWhiteboardActive ? 'hidden' : ''} md:flex flex-col min-h-0`}>
                    <ChatView
                        modelId={ModelId.QUALITY}
                        systemInstructionOverride={ALGERIAN_TEACHER_RESOURCES.systemInstruction}
                        inputFontClass="font-teacher"
                        onNewMessages={handleNewMessages}
                     />
                </div>
                 <div className={`${mobileView === 'chat' ? 'hidden' : ''} md:flex flex-col min-h-0`}>
                    <Whiteboard steps={whiteboardSteps} />
                </div>
            </div>
        </div>
    );
};

export const AlgerianTeacherApp: React.FC<AlgerianTeacherAppProps> = ({ onBack }) => {
    const [page, setPage] = useState<'home' | 'chat' | 'books' | 'lessons' | 'websites' | 'calculator'>('home');
    const [showSplash, setShowSplash] = useState(true);

    const MainContent = () => {
        switch (page) {
            case 'chat':
                return <ChatWithWhiteboard onBack={() => setPage('home')} />;
            case 'books':
                return <ResourcePage title="الكتب المدرسية" resources={ALGERIAN_TEACHER_RESOURCES.books} onBack={() => setPage('home')} />;
            case 'lessons':
                return <ResourcePage title="الدروس والملخصات" resources={ALGERIAN_TEACHER_RESOURCES.lessons} onBack={() => setPage('home')} />;
            case 'websites':
                return <WebsiteViewerPage onBack={() => setPage('home')} />;
            case 'calculator':
                return <GradeCalculator onBack={() => setPage('home')} />;
            case 'home':
            default:
                return (
                    <div className="flex-1 flex flex-col items-center p-4 pt-24 pb-4 overflow-y-auto">
                         <header className="absolute top-0 left-0 p-4">
                            <button onClick={onBack} className="p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors backdrop-blur-sm">
                                <ArrowLeftIcon className="w-6 h-6 transform scale-x-[-1]" />
                            </button>
                        </header>
                        <h1 className="text-3xl md:text-4xl font-bold text-white text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>مساعدك الدراسي للسنة الرابعة متوسط</h1>
                        <ExamCountdown />
                        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                             {[
                                { page: 'chat', label: 'الأستاذ', Icon: MessageSquareIcon },
                                { page: 'books', label: 'الكتب', Icon: BookIcon },
                                { page: 'lessons', label: 'الملخصات', Icon: FileTextIcon },
                                { page: 'websites', label: 'مواقع تعليمية', Icon: GlobeIcon },
                            ].map(({ page, label, Icon }) => (
                                <button key={page} onClick={() => setPage(page as any)} className="group p-4 flex flex-col items-center justify-center gap-4 bg-white/30 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-xl hover:bg-white/50 transition-all duration-300 text-white hover:text-gray-800">
                                    <Icon className="w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-300 group-hover:scale-110" />
                                    <span className="text-lg sm:text-xl font-semibold transition-colors">{label}</span>
                                </button>
                            ))}
                            <button onClick={() => setPage('calculator')} className="col-span-2 group p-4 flex items-center justify-center gap-4 bg-white/30 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-xl hover:bg-white/50 transition-all duration-300 text-white hover:text-gray-800">
                                <CalculatorIcon className="w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-300 group-hover:scale-110" />
                                <span className="text-lg sm:text-xl font-semibold transition-colors">حساب المعدل</span>
                            </button>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="h-full w-full font-teacher relative bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=2832&auto=format&fit=crop')` }}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative h-full w-full flex flex-col">
                {showSplash ? <Splash onFinished={() => setShowSplash(false)} /> : <div key={page} className="animate-fade-in h-full w-full"><MainContent /></div>}
            </div>
        </div>
    );
};
