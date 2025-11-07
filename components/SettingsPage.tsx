import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeftIcon, SunIcon, MoonIcon, LaptopIcon, TrashIcon, MicrophoneIcon, Volume2Icon } from './Icons';
import { Theme } from '../types';

interface SettingsPageProps {
    onBack: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--token-text-tertiary)] uppercase tracking-wider mb-3 px-2">{title}</h2>
        <div className="bg-[var(--token-main-surface-secondary)] border border-[var(--token-border-default)] rounded-xl divide-y divide-[var(--token-border-default)]">
            {children}
        </div>
    </div>
);

const SettingsItem: React.FC<{ children: React.ReactNode; }> = ({ children }) => (
    <div className="p-4 flex justify-between items-center">
        {children}
    </div>
);

const FONT_SIZES = [
    { name: 'صغير', value: '14px' },
    { name: 'متوسط', value: '16px' },
    { name: 'كبير', value: '18px' },
];

const TTS_VOICES = [
    { id: 'Puck', name: 'ذكر 1' },
    { id: 'Zephyr', name: 'ذكر 2' },
    { id: 'Charon', name: 'ذكر 3' },
    { id: 'Kore', name: 'أنثى 1' },
    { id: 'Fenrir', name: 'أنثى 2' },
];

const ToggleSwitch: React.FC<{ enabled: boolean, onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
    </button>
);


export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
    const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || '16px');
    const [micPermission, setMicPermission] = useState(() => localStorage.getItem('permission_mic') === 'true');
    const [ttsVoice, setTtsVoice] = useState(() => localStorage.getItem('tts_voice') || 'Puck');

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'system') {
            localStorage.removeItem('theme');
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.toggle('dark', systemTheme === 'dark');
        } else {
            localStorage.setItem('theme', theme);
            root.classList.toggle('dark', theme === 'dark');
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('fontSize', fontSize);
        document.documentElement.style.setProperty('--font-size-base', fontSize);
    }, [fontSize]);
    
    useEffect(() => {
        localStorage.setItem('tts_voice', ttsVoice);
    }, [ttsVoice]);

    useEffect(() => {
        const rootStyle = document.documentElement.style;
        // The main font is now controlled by the --font-family-sans variable in index.html
        // This component only needs to manage theme and font size.
    }, []);
    
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (theme === 'system') {
                 document.documentElement.classList.toggle('dark', e.matches);
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);
    
    useEffect(() => {
        localStorage.setItem('permission_mic', String(micPermission));
    }, [micPermission]);

    const handleClearData = () => {
        if (window.confirm("هل أنت متأكد من أنك تريد مسح جميع بيانات المحادثة؟ لا يمكن التراجع عن هذا الإجراء.")) {
            window.location.reload();
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto">
            <header className="sticky top-0 bg-[var(--token-main-surface-primary)]/80 backdrop-blur-md z-10 p-4 border-b border-[var(--token-border-default)]">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--token-main-surface-tertiary)] transition-colors">
                        <ArrowLeftIcon className="w-6 h-6 transform scale-x-[-1] text-[var(--token-icon-primary)]" />
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--token-text-primary)]">الإعدادات</h1>
                    <div className="w-10"></div>
                </div>
            </header>
            <main className="p-4 md:p-8">
                <div className="max-w-2xl mx-auto">

                    <SettingsSection title="المظهر">
                        <SettingsItem>
                            <span className="text-base text-[var(--token-text-primary)]">السمة</span>
                            <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--token-main-surface-tertiary)]">
                                {[
                                    { value: 'light', label: 'فاتح', Icon: SunIcon },
                                    { value: 'dark', label: 'داكن', Icon: MoonIcon },
                                    { value: 'system', label: 'النظام', Icon: LaptopIcon },
                                ].map(({ value, label, Icon }) => (
                                    <button
                                        key={value}
                                        onClick={() => setTheme(value as Theme)}
                                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                                            theme === value
                                                ? 'bg-[var(--token-main-surface-primary)] text-[var(--token-text-primary)] shadow-sm'
                                                : 'text-[var(--token-text-secondary)] hover:bg-[var(--token-main-surface-primary)]/50'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="hidden sm:inline">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </SettingsItem>
                        <SettingsItem>
                            <span className="text-base text-[var(--token-text-primary)]">حجم الخط</span>
                             <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--token-main-surface-tertiary)]">
                                {FONT_SIZES.map(({name, value}) => (
                                     <button
                                        key={value}
                                        onClick={() => setFontSize(value)}
                                        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                                            fontSize === value
                                                ? 'bg-[var(--token-main-surface-primary)] text-[var(--token-text-primary)] shadow-sm'
                                                : 'text-[var(--token-text-secondary)] hover:bg-[var(--token-main-surface-primary)]/50'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                             </div>
                        </SettingsItem>
                    </SettingsSection>

                    <SettingsSection title="الصوت">
                         <SettingsItem>
                            <div className="flex items-center gap-3">
                                <Volume2Icon className="w-5 h-5 text-[var(--token-icon-secondary)]" />
                                <div>
                                    <h3 className="text-base text-[var(--token-text-primary)]">صوت المساعد (النصي)</h3>
                                    <p className="text-xs text-[var(--token-text-secondary)]">الصوت المستخدم عند تحويل النص إلى كلام.</p>
                                 </div>
                            </div>
                            <select
                                value={ttsVoice}
                                onChange={e => setTtsVoice(e.target.value)}
                                className="p-2 bg-[var(--token-main-surface-tertiary)] border border-[var(--token-border-default)] rounded-lg text-sm text-[var(--token-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--token-primary)]"
                            >
                                {TTS_VOICES.map(voice => (
                                    <option key={voice.id} value={voice.id}>{voice.name}</option>
                                ))}
                            </select>
                        </SettingsItem>
                    </SettingsSection>
                    
                    <SettingsSection title="الأذونات">
                        <SettingsItem>
                            <div className="flex items-center gap-3">
                                <MicrophoneIcon className="w-5 h-5 text-[var(--token-icon-secondary)]" />
                                <div>
                                    <h3 className="text-base text-[var(--token-text-primary)]">الوصول إلى الميكروفون</h3>
                                    <p className="text-xs text-[var(--token-text-secondary)]">مطلوب لميزة الإدخال الصوتي.</p>
                                 </div>
                            </div>
                            <ToggleSwitch enabled={micPermission} onChange={setMicPermission} />
                        </SettingsItem>
                    </SettingsSection>


                    <SettingsSection title="البيانات والخصوصية">
                        <SettingsItem>
                            <div className="flex items-center gap-3">
                                 <TrashIcon className="w-5 h-5 text-red-500" />
                                 <div>
                                    <h3 className="text-base text-[var(--token-text-primary)]">مسح جميع بيانات المحادثة</h3>
                                    <p className="text-xs text-[var(--token-text-secondary)]">سيؤدي هذا إلى إعادة تعيين التطبيق وحذف جميع المحادثات الحالية.</p>
                                 </div>
                            </div>
                            <button onClick={handleClearData} className="px-4 py-1.5 text-sm font-semibold text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors">
                                مسح البيانات
                            </button>
                        </SettingsItem>
                    </SettingsSection>

                    <SettingsSection title="حول التطبيق">
                         <SettingsItem>
                            <span className="text-base text-[var(--token-text-primary)]">اسم التطبيق</span>
                            <span className="text-base text-[var(--token-text-secondary)]">MOHO AI Assistant</span>
                        </SettingsItem>
                        <SettingsItem>
                            <span className="text-base text-[var(--token-text-primary)]">الإصدار</span>
                            <span className="text-base text-[var(--token-text-secondary)]">1.2.0</span>
                        </SettingsItem>
                         <SettingsItem>
                            <span className="text-base text-[var(--token-text-primary)]">المطور</span>
                            <span className="text-base text-[var(--token-text-secondary)]">حمزة محمد هارون (MOHO AI)</span>
                        </SettingsItem>
                    </SettingsSection>
                </div>
            </main>
        </div>
    );
};