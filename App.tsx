import React, { useState, useCallback, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { ModelId, WeatherData } from './types';
import { MODELS } from './constants';
import { ChatView } from './components/ChatView';
import { DesignPreview } from './components/DesignPreview';
import { SettingsPage } from './components/SettingsPage';
import { SocialChatView } from './components/SocialChatView';
import { SettingsIcon, AlgerianTeacherIcon, NoorAlIslamIcon, WeatherAppIcon, PlusIcon } from './components/Icons';
import { AlgerianTeacherApp } from './components/AlgerianTeacherApp';
import { NoorAlIslamApp } from './components/noor-al-islam/NoorAlIslamApp';
import { AdhanNotifier } from './components/AdhanNotifier';
import { WeatherApp } from './components/WeatherApp';

const ModelSelectorDropdown: React.FC<{
    activeModel: ModelId;
    setActiveModel: (model: ModelId) => void;
}> = ({ activeModel, setActiveModel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelectModel = (modelId: ModelId) => {
        setActiveModel(modelId);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);
    
    const modelOptions = Object.values(MODELS).map(model => ({
        id: model.id,
        name: model.name,
        Icon: model.Icon,
        description: {
            [ModelId.ADAPTIVE]: 'مساعدة شاملة وسريعة',
            [ModelId.QUALITY]: 'للاستدلال والمهام الصعبة',
            [ModelId.RESEARCHER]: 'للبحث المتخصص وجمع المعلومات',
            [ModelId.SOCIAL]: 'للتفاعل وإنشاء المحتوى',
        }[model.id] || ''
    }));

    const CheckIcon = () => (
        <svg className="h-5 w-5 text-[var(--token-on-primary-container)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div>
                <button type="button" onClick={toggleDropdown} className="inline-flex items-center justify-center w-full rounded-full bg-[var(--token-main-surface-tertiary)]/80 backdrop-blur-md border border-[var(--token-border-default)] px-4 py-2 text-sm font-medium text-[var(--token-text-primary)] hover:bg-[var(--token-main-surface-secondary)]/50 focus:outline-none" aria-expanded={isOpen} aria-haspopup="true">
                    <span>{MODELS[activeModel].name}</span>
                    <svg className={`mr-2 -ml-1 h-5 w-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            {isOpen && (
                <div className="origin-top-right absolute left-1/2 -translate-x-1/2 mt-2 w-80 rounded-lg shadow-2xl bg-[var(--token-main-surface-secondary)] ring-1 ring-black ring-opacity-5 focus:outline-none" style={{boxShadow: 'var(--elevation-3)'}}>
                    <div className="p-2" role="none">
                        <div className="space-y-1">
                            {modelOptions.map(option => {
                                const isActive = activeModel === option.id;
                                return (
                                    <button key={option.id} onClick={() => handleSelectModel(option.id)} className={`group flex items-center w-full text-right p-3 rounded-lg hover:bg-[var(--token-main-surface-tertiary)] transition-colors duration-150 ${isActive ? 'bg-[var(--token-interactive-bg-primary-container)]' : ''}`}>
                                        <div className="w-10 mr-3 flex-shrink-0 flex items-center justify-center">
                                            {isActive ? <CheckIcon /> : <option.Icon className="h-6 w-6 text-[var(--token-icon-secondary)]" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-semibold ${isActive ? 'text-[var(--token-on-primary-container)]' : 'text-[var(--token-text-primary)]'}`}>{option.name}</p>
                                            <p className={`text-xs ${isActive ? 'text-[var(--token-on-primary-container)] opacity-80' : 'text-[var(--token-text-secondary)]'}`}>{option.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


interface DesignModeViewProps extends React.ComponentProps<typeof ChatView> {
    designContent: string;
    setDesignContent: (content: string) => void;
}

const DesignModeView: React.FC<DesignModeViewProps> = ({ designContent, setDesignContent, ...chatViewProps }) => {
    const [mobileView, setMobileView] = useState<'design' | 'chat'>('chat');

    return (
        <div className="flex-1 w-full h-full overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:grid grid-cols-2 gap-4 p-4 w-full h-full">
                <div className="flex flex-col min-h-0 pt-16 h-full">
                    <ChatView {...chatViewProps} setDesignContent={setDesignContent} key={`${chatViewProps.modelId}-design-desktop`} />
                </div>
                <div className="flex flex-col min-h-0 pt-16 h-full">
                    <DesignPreview code={designContent} setCode={setDesignContent} />
                </div>
            </div>
            {/* Mobile View */}
            <div className="md:hidden flex flex-col h-full">
                 <div className="pt-16 flex-shrink-0 bg-[var(--token-main-surface-primary)] z-10">
                    <div className="p-2 border-b border-[var(--token-border-default)]">
                        <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--token-main-surface-tertiary)] w-full">
                            <button
                                onClick={() => setMobileView('design')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-full transition-colors ${mobileView === 'design' ? 'bg-[var(--token-main-surface-primary)] shadow-sm' : 'text-[var(--token-text-secondary)]'}`}
                            >
                                معاينة التصميم
                            </button>
                            <button
                                onClick={() => setMobileView('chat')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-full transition-colors ${mobileView === 'chat' ? 'bg-[var(--token-main-surface-primary)] shadow-sm' : 'text-[var(--token-text-secondary)]'}`}
                            >
                                المحادثة
                            </button>
                        </div>
                    </div>
                </div>
                <div className={`flex-1 min-h-0 ${mobileView === 'chat' ? 'flex flex-col' : 'hidden'}`}>
                    <ChatView {...chatViewProps} setDesignContent={setDesignContent} key={`${chatViewProps.modelId}-design-mobile`} />
                </div>
                <div className={`flex-1 min-h-0 ${mobileView === 'design' ? 'flex flex-col' : 'hidden'}`}>
                    <DesignPreview code={designContent} setCode={setDesignContent} />
                </div>
            </div>
        </div>
    );
};


const ChatContainer: React.FC<{
    activeModel: ModelId;
    isDesignMode: boolean;
    toggleDesignMode: () => void;
    designContent: string;
    setDesignContent: (content: string) => void;
    handleModelChangeAndSetPrompt: (modelId: ModelId, prompt: string) => void;
    promptForNextModel: string | null;
    clearInitialPrompt: () => void;
}> = ({
    activeModel,
    isDesignMode,
    toggleDesignMode,
    designContent,
    setDesignContent,
    handleModelChangeAndSetPrompt,
    promptForNextModel,
    clearInitialPrompt
}) => {
    const isComplexModelInDesignMode = activeModel === ModelId.QUALITY && isDesignMode;

    const chatWrapperClasses = "flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden pt-16";

    if (activeModel === ModelId.SOCIAL) {
        return <SocialChatView key="social-view" />;
    }

    if (isComplexModelInDesignMode) {
        return (
            <DesignModeView
                designContent={designContent}
                setDesignContent={setDesignContent}
                modelId={activeModel}
                isDesignModeEnabled={isDesignMode}
                toggleDesignMode={toggleDesignMode}
                onModelChangeAndSetPrompt={handleModelChangeAndSetPrompt}
                initialPrompt={promptForNextModel}
                clearInitialPrompt={clearInitialPrompt}
            />
        );
    }
    
    return (
        <div className={chatWrapperClasses}>
            <ChatView
                modelId={activeModel}
                key={activeModel}
                isDesignModeEnabled={isDesignMode}
                toggleDesignMode={toggleDesignMode}
                setDesignContent={setDesignContent}
                onModelChangeAndSetPrompt={handleModelChangeAndSetPrompt}
                initialPrompt={promptForNextModel}
                clearInitialPrompt={clearInitialPrompt}
            />
        </div>
    );
};

const AppDrawer: React.FC<{ onAppSelect: (view: 'weatherApp' | 'teacherApp' | 'noorAlIslam') => void }> = ({ onAppSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (view: 'weatherApp' | 'teacherApp' | 'noorAlIslam') => {
        onAppSelect(view);
        setIsOpen(false);
    };

    return (
        <div className="relative flex items-center" ref={drawerRef}>
            {/* The trigger button */}
            <button onClick={() => setIsOpen(!isOpen)} className={`p-2 rounded-full bg-[var(--token-main-surface-tertiary)]/60 text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-primary)] transition-all z-10`} aria-expanded={isOpen} aria-label="Open Apps">
                <PlusIcon className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* The pop-out menu */}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 flex w-auto min-w-max flex-col items-center gap-2 rounded-full bg-[var(--token-main-surface-tertiary)]/80 p-3 backdrop-blur-md border border-[var(--token-border-default)] origin-top transition-all duration-200 ease-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <button onClick={() => handleSelect('weatherApp')} className="p-3 rounded-full text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-primary)] transition-colors" aria-label="تطبيق الطقس">
                    <WeatherAppIcon className="w-8 h-8" />
                </button>
                <button onClick={() => handleSelect('teacherApp')} className="p-3 rounded-full text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-primary)] transition-colors" aria-label="تطبيق السنة الرابعة متوسط">
                    <AlgerianTeacherIcon className="w-8 h-8" />
                </button>
                <button onClick={() => handleSelect('noorAlIslam')} className="p-3 rounded-full text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-primary)] transition-colors" aria-label="تطبيق نور الإسلام">
                    <NoorAlIslamIcon className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [activeModel, setActiveModel] = useState<ModelId>(ModelId.ADAPTIVE);
    const [currentView, setCurrentView] = useState<'main' | 'settings' | 'teacherApp' | 'noorAlIslam' | 'weatherApp'>('main');
    const [isDesignMode, setIsDesignMode] = useState(false);
    const [designContent, setDesignContent] = useState('');
    const [promptForNextModel, setPromptForNextModel] = useState<string | null>(null);

    useEffect(() => {
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
    }, []);

    useEffect(() => {
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      });
    }, []);

    const handleSetActiveModel = useCallback((modelId: ModelId) => {
        if (modelId === activeModel && currentView === 'main') return;
        
        setActiveModel(modelId);
        setCurrentView('main');
        if (modelId !== ModelId.QUALITY) {
            setIsDesignMode(false);
            setDesignContent('');
        }
    }, [activeModel, currentView]);
    
    const handleModelChangeAndSetPrompt = useCallback((modelId: ModelId, prompt: string) => {
        setPromptForNextModel(prompt);
        setActiveModel(modelId);
        setCurrentView('main');
    }, []);

    const toggleDesignMode = useCallback(() => {
        if (activeModel === ModelId.QUALITY) {
            setIsDesignMode(prev => !prev);
        }
    }, [activeModel]);

    const clearInitialPrompt = useCallback(() => {
        if (promptForNextModel) {
            setPromptForNextModel(null);
        }
    }, [promptForNextModel]);

    const renderContent = () => {
        switch(currentView) {
            case 'settings':
                return <SettingsPage onBack={() => setCurrentView('main')} />;
            case 'teacherApp':
                return <AlgerianTeacherApp onBack={() => setCurrentView('main')} />;
            case 'noorAlIslam':
                return <NoorAlIslamApp onBack={() => setCurrentView('main')} />;
            case 'weatherApp':
                return <WeatherApp onBack={() => setCurrentView('main')} />;
            case 'main':
            default:
                return (
                     <>
                        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2">
                             <div className="w-auto justify-start">
                                <AppDrawer onAppSelect={(view) => setCurrentView(view)} />
                            </div>
                             <ModelSelectorDropdown
                                activeModel={activeModel} 
                                setActiveModel={handleSetActiveModel}
                            />
                            <div className="flex items-center gap-2 w-auto justify-end">
                                <button
                                    onClick={() => setCurrentView('settings')}
                                    className="p-2 rounded-full text-[var(--token-icon-secondary)] bg-[var(--token-main-surface-tertiary)]/60 hover:bg-[var(--token-main-surface-primary)] transition-colors"
                                    aria-label="الإعدادات"
                                >
                                    <SettingsIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </header>
                        <ChatContainer
                            activeModel={activeModel}
                            isDesignMode={isDesignMode}
                            toggleDesignMode={toggleDesignMode}
                            designContent={designContent}
                            setDesignContent={setDesignContent}
                            handleModelChangeAndSetPrompt={handleModelChangeAndSetPrompt}
                            promptForNextModel={promptForNextModel}
                            clearInitialPrompt={clearInitialPrompt}
                        />
                    </>
                );
        }
    };

    return (
        <div className="h-screen w-screen font-sans bg-[var(--token-main-surface-primary)] flex flex-col relative overflow-hidden">
            <AdhanNotifier />
            <main className="flex-1 flex flex-col w-full overflow-hidden">
               {renderContent()}
            </main>
        </div>
    );
};

export default App;