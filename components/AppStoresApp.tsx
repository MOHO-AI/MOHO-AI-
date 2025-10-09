import React, { useState, useRef, useMemo, useCallback } from 'react';
import { ArrowLeftIcon, LoaderIcon, GlobeIcon, ChevronLeftIcon, ChevronRightIcon, RefreshIcon, XIcon } from './Icons';
import { APP_STORES } from '../data/appStores';
import { ModelId } from '../types';
import { generateStructuredContent } from '../services/geminiService';
import { Type } from "@google/genai";

interface AppStore {
    name: string;
    url: string;
}

interface AppStoresAppProps {
    onBack: () => void;
}

const StoreButton: React.FC<{ store: AppStore, onClick: () => void }> = ({ store, onClick }) => {
    const [faviconError, setFaviconError] = useState(false);
    const domain = new URL(store.url).hostname;
    const faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

    return (
        <button onClick={onClick} className="p-4 flex flex-col justify-center items-center gap-3 bg-[var(--token-surface-container-high)] rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-transparent hover:border-[var(--token-primary)]">
            <div className="w-12 h-12 bg-[var(--token-surface-container-highest)] rounded-full flex items-center justify-center">
                {faviconError ? (
                    <GlobeIcon className="w-8 h-8 text-[var(--token-on-surface-variant)]" />
                ) : (
                    <img
                        src={faviconUrl}
                        alt=""
                        className="w-10 h-10 object-contain"
                        onError={() => setFaviconError(true)}
                    />
                )}
            </div>
            <span className="text-sm font-semibold text-center text-[var(--token-on-surface)]">{store.name}</span>
        </button>
    );
};

const IframeViewer: React.FC<{ store: AppStore, onBack: () => void }> = ({ store, onBack }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleGoBack = () => iframeRef.current?.contentWindow?.history.back();
    const handleGoForward = () => iframeRef.current?.contentWindow?.history.forward();

    return (
        <div className="h-full flex flex-col bg-[var(--token-main-surface-primary)]">
            <header className="p-2 flex items-center justify-between gap-2 border-b border-[var(--token-border-default)] flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)] flex-shrink-0"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                    <h3 className="font-semibold truncate">{store.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                     <button onClick={handleGoBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]" aria-label="للخلف"><ChevronRightIcon className="w-5 h-5" /></button>
                     <button onClick={handleGoForward} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]" aria-label="للأمام"><ChevronLeftIcon className="w-5 h-5" /></button>
                    <a href={store.url} target="_blank" rel="noopener noreferrer" className="text-sm px-3 py-1.5 bg-[var(--token-main-surface-tertiary)] rounded-full hover:bg-[var(--token-border-default)] flex-shrink-0">
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
                    src={store.url}
                    title={store.name}
                    className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    onLoad={() => setIsLoading(false)}
                />
            </div>
        </div>
    );
};


export const AppStoresApp: React.FC<AppStoresAppProps> = ({ onBack }) => {
    const [selectedStore, setSelectedStore] = useState<AppStore | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStoreNames, setFilteredStoreNames] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleAISearch = useCallback(async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError(null);
        
        const allStores = [...APP_STORES.android, ...APP_STORES.pc];

        const prompt = `أنت مساعد خبير في متاجر التطبيقات. بناءً على طلب المستخدم، حدد أنسب المتاجر من القائمة المتوفرة.
الطلب: "${searchQuery}"

قائمة المتاجر المتاحة:
${allStores.map(s => `- ${s.name}`).join('\n')}

أرجع إجابتك ككائن JSON يحتوي على مفتاح واحد "stores" وهو عبارة عن مصفوفة من أسماء المتاجر المطابقة. قم بتضمين المتاجر من القائمة المقدمة فقط.`;

        const schema = {
            type: Type.OBJECT,
            properties: {
                stores: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        };

        try {
            const result: { stores: string[] } | null = await generateStructuredContent(ModelId.ADAPTIVE, prompt, '', schema);
            if (result && Array.isArray(result.stores)) {
                setFilteredStoreNames(result.stores);
            } else {
                setError("لم يتم العثور على نتائج. حاول صياغة بحثك بشكل مختلف.");
                setFilteredStoreNames([]);
            }
        } catch (e) {
            console.error(e);
            setError("حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsLoading(false);
        }

    }, [searchQuery]);
    
    const clearFilter = () => {
        setSearchQuery('');
        setFilteredStoreNames(null);
        setError(null);
    };
    
    const { filteredAndroidStores, filteredPcStores } = useMemo(() => {
        if (filteredStoreNames === null) {
            return { filteredAndroidStores: APP_STORES.android, filteredPcStores: APP_STORES.pc };
        }
        const storeSet = new Set(filteredStoreNames);
        return {
            filteredAndroidStores: APP_STORES.android.filter(store => storeSet.has(store.name)),
            filteredPcStores: APP_STORES.pc.filter(store => storeSet.has(store.name))
        };
    }, [filteredStoreNames]);

    if (selectedStore) {
        return <IframeViewer store={selectedStore} onBack={() => setSelectedStore(null)} />;
    }

    return (
        <div className="h-full w-full flex flex-col bg-[var(--token-surface-container)]">
            <header className="p-2 flex items-center gap-2 border-b border-[var(--token-border-default)] flex-shrink-0 bg-[var(--token-main-surface-primary)]">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                <h1 className="text-xl font-bold">متاجر التطبيقات</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                         <div className="relative">
                             <input 
                                 type="text"
                                 value={searchQuery}
                                 onChange={e => setSearchQuery(e.target.value)}
                                 onKeyDown={e => e.key === 'Enter' && handleAISearch()}
                                 placeholder="ابحث بالذكاء الاصطناعي... (مثال: متاجر ألعاب للحاسوب)"
                                 className="w-full p-4 pr-12 bg-[var(--token-surface-container-high)] border border-[var(--token-outline-variant)] rounded-full focus:ring-2 focus:ring-[var(--token-primary)] outline-none"
                            />
                            <button onClick={handleAISearch} disabled={isLoading} className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 bg-[var(--token-primary)] text-[var(--token-on-primary)] rounded-full hover:opacity-90 disabled:bg-gray-400">
                                {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>}
                            </button>
                         </div>
                         {filteredStoreNames !== null && (
                             <button onClick={clearFilter} className="mt-2 text-sm text-[var(--token-primary)] hover:underline flex items-center gap-1 mx-auto">
                                 <XIcon className="w-3.5 h-3.5" />
                                 <span>مسح نتائج البحث ({filteredStoreNames.length} نتيجة)</span>
                             </button>
                         )}
                         {error && <p className="text-center text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    {filteredAndroidStores.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-4 tracking-tight text-[var(--token-on-surface)]">متاجر أندرويد</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredAndroidStores.map(store => <StoreButton key={store.name} store={store} onClick={() => setSelectedStore(store)} />)}
                            </div>
                        </div>
                    )}

                    {filteredPcStores.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 tracking-tight text-[var(--token-on-surface)]">متاجر الحاسوب</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredPcStores.map(store => <StoreButton key={store.name} store={store} onClick={() => setSelectedStore(store)} />)}
                            </div>
                        </div>
                    )}
                    
                    {filteredStoreNames !== null && filteredAndroidStores.length === 0 && filteredPcStores.length === 0 && !isLoading && (
                        <div className="text-center py-16">
                            <p className="text-lg font-semibold text-[var(--token-on-surface-variant)]">لا توجد متاجر تطابق بحثك.</p>
                            <p className="text-sm text-[var(--token-on-surface-variant)]">حاول تعديل مصطلحات البحث أو مسح النتائج لعرض جميع المتاجر.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};