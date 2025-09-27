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
        : "h-full w-full flex flex-col font-islamic bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:to-green-900/50";
    
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
            <footer className="w-full border-t border-[var(--token-border-default)] bg-[var(--token-main-surface-primary)] z-20">
                <div className="max-w-md mx-auto grid grid-cols-4">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setPage(tab.id)}
                            className={`flex flex-col items-center justify-center gap-1 py-2 text-center transition-colors duration-200 relative ${page === tab.id ? 'text-green-600 dark:text-green-400' : 'text-[var(--token-text-tertiary)] hover:text-[var(--token-text-primary)]'}`}
                        >
                             {page === tab.id && <div className="absolute top-0 h-0.5 w-1/2 bg-green-500 rounded-full"></div>}
                            <tab.Icon className={`w-7 h-7 mb-0.5 transition-all ${page === tab.id ? '' : 'grayscale opacity-70'}`} />
                            <span className="text-xs font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </footer>
        </div>
    );
};