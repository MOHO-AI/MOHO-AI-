import React, { useState, useCallback } from 'react';
import { QuranScrollLocation } from '../types';
import { ChatView } from './ChatView';
import { QuranReader } from './QuranReader';
import { ModelId } from '../types';

export const QuranView: React.FC = () => {
    const [scrollToLocation, setScrollToLocation] = useState<QuranScrollLocation | null>(null);
    const [playLocation, setPlayLocation] = useState<QuranScrollLocation | null>(null);
    const [mobileView, setMobileView] = useState<'reader' | 'chat'>('chat');

    const handleScrollComplete = useCallback(() => {
        setScrollToLocation(null);
    }, []);

    const handlePlayComplete = useCallback(() => {
        setPlayLocation(null);
    }, []);
    
    const chatViewProps = {
        modelId: ModelId.ADAPTIVE, // Placeholder, will be overridden by system instruction
        setScrollToLocation: setScrollToLocation,
        setPlayLocation: setPlayLocation,
        systemInstructionOverride: `
أنت "موهو المُحفِّظ"، عالم قرآني خبير ومتخصص. هدفك هو مساعدة المستخدمين على حفظ القرآن الكريم وفهمه وتدبره.
عندما تريد توجيه المستخدم إلى سورة وآية محددة، قم بتضمين أمر خاص في بداية ردك بالتنسيق التالي، ثم أكمل إجابتك كالمعتاد: [SCROLL_TO:{"surah": رقم_السورة, "ayah": رقم_الآية}].
مثال: لتوجيه المستخدم إلى آية الكرسي (سورة البقرة، الآية 255)، أضف في بداية ردك: [SCROLL_TO:{"surah": 2, "ayah": 255}]. لا تضف أي نص قبل هذا الأمر.
إذا طلب منك المستخدم تشغيل آية أو سورة، استخدم الأمر التالي لبدء التشغيل من آية محددة: [PLAY_AYAH:{"surah": رقم_السورة, "ayah": رقم_الآية}]. لا تضف أي نص قبل هذا الأمر.

قدراتك تشمل:
- شرح وتفسير الآيات (التفسير الميسر، التحليلي، إلخ).
- توضيح أسباب النزول.
- شرح أحكام التجويد بالتفصيل.
- وضع خطط وجداول زمنية لمساعدة المستخدمين على حفظ السور.
- تقديم نصائح لتحسين الحفظ والمراجعة.
- الإجابة على أي سؤال يتعلق بعلوم القرآن.
- استخدم البحث في الويب للإجابة على الأسئلة التي تتطلب معرفة معاصرة تتعلق بالدراسات الإسلامية.
كن دائمًا محترمًا وموقرًا عند الحديث عن القرآن الكريم.`
    };
    
    const quranReaderProps = {
        scrollToLocation: scrollToLocation,
        onScrollComplete: handleScrollComplete,
        playLocation: playLocation,
        onPlayComplete: handlePlayComplete,
    };

    return (
        <div className="flex-1 w-full h-full overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:grid grid-cols-2 gap-4 p-4 w-full h-full">
                <div className="flex flex-col min-h-0 h-full">
                    <ChatView {...chatViewProps} key="quran-chat-desktop" />
                </div>
                <div className="flex flex-col min-h-0 h-full">
                    <QuranReader {...quranReaderProps} />
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col h-full">
                 <div className="flex-shrink-0 bg-[var(--token-main-surface-primary)] z-10">
                    <div className="p-2 border-b border-[var(--token-border-default)]">
                        <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--token-main-surface-tertiary)] w-full">
                            <button
                                onClick={() => setMobileView('reader')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-full transition-colors ${mobileView === 'reader' ? 'bg-[var(--token-main-surface-primary)] shadow-sm' : 'text-[var(--token-text-secondary)]'}`}
                            >
                                المصحف
                            </button>
                            <button
                                onClick={() => setMobileView('chat')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-full transition-colors ${mobileView === 'chat' ? 'bg-[var(--token-main-surface-primary)] shadow-sm' : 'text-[var(--token-text-secondary)]'}`}
                            >
                                المساعد
                            </button>
                        </div>
                    </div>
                </div>
                <div className={`flex-1 min-h-0 ${mobileView === 'chat' ? 'flex flex-col' : 'hidden'}`}>
                    <ChatView {...chatViewProps} key="quran-chat-mobile" />
                </div>
                <div className={`flex-1 min-h-0 ${mobileView === 'reader' ? 'flex flex-col' : 'hidden'}`}>
                    <QuranReader {...quranReaderProps} />
                </div>
            </div>
        </div>
    );
};
