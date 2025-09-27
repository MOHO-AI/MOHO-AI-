import React, { useState, useRef } from 'react';
import { LoaderIcon, ChevronLeftIcon, ChevronRightIcon } from '../Icons';

const SUNNAH_URL = "https://sunnah.com/";

export const SunnahWebsiteViewer: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleGoBack = () => {
        iframeRef.current?.contentWindow?.history.back();
    };

    const handleGoForward = () => {
        iframeRef.current?.contentWindow?.history.forward();
    };

    return (
        <div className="h-full flex flex-col bg-[var(--token-main-surface-primary)]">
            <header className="p-2 flex items-center justify-between gap-2 border-b border-[var(--token-border-default)] flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold truncate">Sunnah.com</h3>
                </div>
                <div className="flex items-center gap-1">
                     <button onClick={handleGoBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]" aria-label="للخلف"><ChevronRightIcon className="w-5 h-5" /></button>
                     <button onClick={handleGoForward} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]" aria-label="للأمام"><ChevronLeftIcon className="w-5 h-5" /></button>
                    <a href={SUNNAH_URL} target="_blank" rel="noopener noreferrer" className="text-sm px-3 py-1.5 bg-[var(--token-main-surface-tertiary)] rounded-full hover:bg-[var(--token-border-default)] flex-shrink-0">
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
                    src={SUNNAH_URL}
                    title="Sunnah.com"
                    className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    onLoad={() => setIsLoading(false)}
                />
            </div>
        </div>
    );
};
