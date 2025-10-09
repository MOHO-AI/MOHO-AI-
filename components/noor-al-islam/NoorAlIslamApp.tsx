import React, { useState } from 'react';
import { ArrowLeftIcon, QuranFeatureIcon, HadithIcon, PrayerTimeIcon, IslamicCalendarIcon, SettingsIcon } from '../Icons';
import { QuranView } from '../QuranView';
import { PrayerTimes } from './PrayerTimes';
import { IslamicCalendar } from './IslamicCalendar';
import { SunnahWebsiteViewer } from './SunnahWebsiteViewer';
import { AdhanSettings } from './AdhanSettings';


interface NoorAlIslamAppProps {
    onBack: () => void;
}

type NoorPage = 'quran' | 'hadith' | 'prayer' | 'calendar' | 'settings';

export const NoorAlIslamApp: React.FC<NoorAlIslamAppProps> = ({ onBack }) => {
    const [page, setPage] = useState<NoorPage>('prayer');

    const TABS: { id: NoorPage; label: string; Icon: React.FC<any>; }[] = [
        { id: 'prayer', label: 'الصلاة', Icon: PrayerTimeIcon },
        { id: 'calendar', label: 'التقويم', Icon: IslamicCalendarIcon },
        { id: 'hadith', label: 'الحديث', Icon: HadithIcon },
        { id: 'quran', label: 'القرآن', Icon: QuranFeatureIcon },
    ];

    const renderPage = () => {
        switch (page) {
            case 'quran': return <QuranView />;
            case 'hadith': return <SunnahWebsiteViewer />;
            case 'prayer': return <PrayerTimes />;
            case 'calendar': return <IslamicCalendar />;
            default: return null;
        }
    };
    
    if (page === 'settings') {
        return <AdhanSettings onBack={() => setPage('prayer')} />;
    }

    const containerClasses = page === 'quran'
        ? "h-full w-full flex flex-col font-islamic bg-[var(--token-main-surface-primary)]"
        : "h-full w-full flex flex-col font-islamic bg-[var(--token-surface-container)]";
    
    return (
        <div className={containerClasses}>
            <header className="sticky top-0 bg-[var(--token-main-surface-primary)]/80 backdrop-blur-md z-20 p-2 border-b border-[var(--token-border-default)]">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)] transition-colors">
                        <ArrowLeftIcon className="w-6 h-6 transform scale-x-[-1] text-[var(--token-icon-primary)]" />
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-500">
                        نور الإسلام
                    </h1>
                    <button onClick={() => setPage('settings')} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)] transition-colors" aria-label="إعدادات الأذان">
                        <SettingsIcon className="w-6 h-6 text-[var(--token-icon-primary)]" />
                    </button>
                </div>
            </header>
            <main className="flex-1 w-full overflow-hidden">
                {renderPage()}
            </main>
            <footer className="w-full border-t border-[var(--token-border-default)] bg-[var(--token-surface-container-low)] z-20">
                <div className="max-w-md mx-auto grid grid-cols-4">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setPage(tab.id)}
                            className={`flex flex-col items-center justify-center gap-1 py-2 text-center transition-colors duration-200 relative ${page === tab.id ? 'text-[var(--token-on-secondary-container)]' : 'text-[var(--token-on-surface-variant)] hover:text-[var(--token-on-surface)]'}`}
                        >
                             <div className={`absolute top-1/2 -translate-y-1/2 w-16 h-8 rounded-full transition-all duration-300 ${page === tab.id ? 'bg-[var(--token-secondary-container)] opacity-100' : 'opacity-0'}`}></div>
                            <div className="relative">
                                <tab.Icon className={`w-7 h-7 mb-0.5 transition-all ${page === tab.id ? '' : 'grayscale opacity-70'}`} />
                            </div>
                            <span className="text-xs font-medium relative">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </footer>
        </div>
    );
};