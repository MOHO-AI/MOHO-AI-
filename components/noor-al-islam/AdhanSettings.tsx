import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, PlayIcon, PauseIcon } from '../Icons';

interface AdhanSettingsProps {
    onBack: () => void;
}

const ToggleSwitch: React.FC<{ enabled: boolean, onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
    </button>
);

export const ADHAN_SOUNDS = [
    { name: 'مكة المكرمة', url: 'https://www.islamcan.com/audio/adhan/azan2.mp3' },
    { name: 'المدينة المنورة', url: 'https://www.islamcan.com/audio/adhan/azan17.mp3' },
    { name: 'المسجد الأقصى', url: 'https://www.islamcan.com/audio/adhan/azan16.mp3' },
    { name: 'مشاري راشد العفاسي', url: 'https://www.islamcan.com/audio/adhan/azan-mishary-rashid-alafasy.mp3' },
];

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_NAMES_AR: { [key: string]: string } = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };

export const AdhanSettings: React.FC<AdhanSettingsProps> = ({ onBack }) => {
    const [globalEnabled, setGlobalEnabled] = useState(() => localStorage.getItem('adhan_global_enabled') === 'true');
    const [selectedSound, setSelectedSound] = useState(() => localStorage.getItem('adhan_sound') || ADHAN_SOUNDS[0].url);
    const [prayerToggles, setPrayerToggles] = useState<{ [key: string]: boolean }>(() => {
        const initialToggles: { [key: string]: boolean } = {};
        PRAYERS.forEach(p => {
            initialToggles[p] = localStorage.getItem(`adhan_enabled_${p.toLowerCase()}`) !== 'false'; // Default to true if not set
        });
        return initialToggles;
    });
    const [isTesting, setIsTesting] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleTogglePrayer = (prayer: string) => {
        setPrayerToggles(prev => ({ ...prev, [prayer]: !prev[prayer] }));
    };

    const handleSave = () => {
        localStorage.setItem('adhan_global_enabled', String(globalEnabled));
        localStorage.setItem('adhan_sound', selectedSound);
        Object.entries(prayerToggles).forEach(([prayer, enabled]) => {
            localStorage.setItem(`adhan_enabled_${prayer.toLowerCase()}`, String(enabled));
        });
        alert('تم حفظ الإعدادات');
        onBack();
    };

    const handleTestSound = () => {
        if (!audioRef.current) return;
        if (isTesting) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsTesting(false);
        } else {
            audioRef.current.src = selectedSound;
            audioRef.current.play().then(() => setIsTesting(true));
        }
    };
    
    useEffect(() => {
        const audio = audioRef.current;
        const onEnded = () => setIsTesting(false);
        audio?.addEventListener('ended', onEnded);
        return () => audio?.removeEventListener('ended', onEnded);
    }, []);

    return (
        <div className="h-full w-full flex flex-col font-sans bg-[var(--token-main-surface-primary)]">
            <header className="p-2 flex items-center justify-between border-b border-[var(--token-border-default)] flex-shrink-0">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                <h1 className="text-xl font-bold">إعدادات الأذان</h1>
                 <button onClick={handleSave} className="px-4 py-1.5 text-sm font-semibold text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/70 transition-colors">
                    حفظ
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                <div className="p-4 bg-[var(--token-main-surface-secondary)] rounded-xl border border-[var(--token-border-default)]">
                    <div className="flex items-center justify-between">
                        <label htmlFor="global-toggle" className="font-semibold text-lg">تفعيل تنبيهات الأذان</label>
                        <ToggleSwitch enabled={globalEnabled} onChange={setGlobalEnabled} />
                    </div>
                </div>

                <div className={`p-4 bg-[var(--token-main-surface-secondary)] rounded-xl border border-[var(--token-border-default)] transition-opacity ${!globalEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h2 className="font-semibold mb-3">صوت الأذان</h2>
                    <select
                        value={selectedSound}
                        onChange={e => setSelectedSound(e.target.value)}
                        className="w-full p-2 bg-white/50 dark:bg-black/20 border border-teal-300/50 dark:border-teal-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 mb-3"
                    >
                        {ADHAN_SOUNDS.map(sound => <option key={sound.url} value={sound.url}>{sound.name}</option>)}
                    </select>
                    <button onClick={handleTestSound} className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors">
                        {isTesting ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        <span>{isTesting ? 'إيقاف' : 'اختبار الصوت'}</span>
                    </button>
                     <audio ref={audioRef} />
                </div>
                
                 <div className={`p-4 bg-[var(--token-main-surface-secondary)] rounded-xl border border-[var(--token-border-default)] transition-opacity ${!globalEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h2 className="font-semibold mb-3">تفعيل التنبيهات للصلوات</h2>
                    <div className="divide-y divide-[var(--token-border-default)]">
                        {PRAYERS.map(prayer => (
                            <div key={prayer} className="py-3 flex items-center justify-between">
                                <label htmlFor={`toggle-${prayer}`} className="font-medium">{PRAYER_NAMES_AR[prayer]}</label>
                                <ToggleSwitch enabled={prayerToggles[prayer]} onChange={() => handleTogglePrayer(prayer)} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
