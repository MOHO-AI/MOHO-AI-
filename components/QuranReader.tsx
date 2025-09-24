import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { fetchQuranData } from '../data/quran';
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon, StopCircleIcon, BookIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import type { QuranScrollLocation } from '../types';

interface QuranReaderProps {
    scrollToLocation: QuranScrollLocation | null;
    onScrollComplete: () => void;
    playLocation: QuranScrollLocation | null;
    onPlayComplete: () => void;
}

const RECITERS = [
    { id: 'ar.alafasy', name: 'مشاري راشد العفاسي' },
    { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي' },
    { id: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد' },
    { id: 'ar.minshawi', name: 'محمد صديق المنشاوي' },
];

const LINES_PER_PAGE = 15; // Heuristic for book mode pagination

export const QuranReader: React.FC<QuranReaderProps> = ({ scrollToLocation, onScrollComplete, playLocation, onPlayComplete }) => {
    const [quranData, setQuranData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSurahNumber, setSelectedSurahNumber] = useState(1);
    
    // UI Mode
    const [isBookMode, setIsBookMode] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Audio Player State
    const [selectedReciter, setSelectedReciter] = useState(RECITERS[0].id);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentAyah, setCurrentAyah] = useState<{ surah: number, ayah: number } | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const highlightedAyahRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const loadQuran = async () => {
            try {
                setIsLoading(true);
                const data = await fetchQuranData();
                setQuranData(data);
                setError(null);
            } catch (err) {
                setError("عذراً، لم نتمكن من تحميل بيانات القرآن الكريم. يرجى المحاولة مرة أخرى لاحقاً.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadQuran();
    }, []);

    const selectedSurah = useMemo(() => {
        if (quranData.length === 0) return null;
        return quranData.find(s => s.number === selectedSurahNumber);
    }, [selectedSurahNumber, quranData]);
    
    const { pages, totalPages } = useMemo(() => {
        if (!selectedSurah || !isBookMode) return { pages: [], totalPages: 0 };
        const ayahs = selectedSurah.ayahs;
        const allPages = [];
        let currentPageAyahs = [];
        let currentLineCount = (selectedSurah.number !== 1 && selectedSurah.number !== 9) ? 1 : 0;

        for (const ayah of ayahs) {
            const ayahLineCount = Math.ceil(ayah.text.length / 45) + (ayah.text.split('\n').length - 1);
            if (currentLineCount + ayahLineCount > LINES_PER_PAGE && currentPageAyahs.length > 0) {
                allPages.push(currentPageAyahs);
                currentPageAyahs = [];
                currentLineCount = 0;
            }
            currentPageAyahs.push(ayah);
            currentLineCount += ayahLineCount;
        }
        if (currentPageAyahs.length > 0) allPages.push(currentPageAyahs);
        return { pages: allPages, totalPages: allPages.length };
    }, [selectedSurah, isBookMode]);

    const handlePageChange = (direction: 'next' | 'prev') => {
        if (direction === 'next' && currentPage < totalPages) {
            setCurrentPage(p => p + 1);
        } else if (direction === 'prev' && currentPage > 1) {
            setCurrentPage(p => p - 1);
        }
    };
    
    // Reset page on surah change
    useEffect(() => {
        setCurrentPage(1);
    },[selectedSurahNumber]);

    const findPageForAyah = useCallback((ayahNumber: number) => {
        if (!isBookMode || pages.length === 0) return -1;
        for (let i = 0; i < pages.length; i++) {
            if (pages[i].some((a: any) => a.number === ayahNumber)) {
                return i + 1;
            }
        }
        return -1;
    }, [isBookMode, pages]);

    // Effect for AI-driven scrolling
    useEffect(() => {
        if (!scrollToLocation || !selectedSurah) return;

        const { surah, ayah } = scrollToLocation;
        if (surah !== selectedSurah.number) {
            setSelectedSurahNumber(surah);
            // Wait for surah to update
            return;
        }

        if (isBookMode) {
            const page = findPageForAyah(ayah);
            if (page !== -1 && page !== currentPage) {
                setCurrentPage(page);
            }
        }
        
        // Defer scroll action to allow UI to update (especially for page turns)
        setTimeout(() => {
            const ayahElement = document.getElementById(`ayah-${surah}-${ayah}`);
            if (ayahElement) {
                ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                ayahElement.style.backgroundColor = 'var(--token-quran-highlight)';
                ayahElement.style.transition = 'background-color 0.5s ease-in-out';
                ayahElement.style.borderRadius = '6px';
                setTimeout(() => { if(ayahElement) ayahElement.style.backgroundColor = 'transparent'; }, 3000);
            }
            onScrollComplete();
        }, 150);

    }, [scrollToLocation, selectedSurah, onScrollComplete, isBookMode, findPageForAyah, currentPage]);
    
    // Effect for AI-driven audio playback
    useEffect(() => {
        if (playLocation) {
             if (playLocation.surah !== selectedSurahNumber) {
                setSelectedSurahNumber(playLocation.surah);
            }
            if (isBookMode) {
                const page = findPageForAyah(playLocation.ayah);
                if (page !== -1 && page !== currentPage) {
                    setCurrentPage(page);
                }
            }
            setCurrentAyah({ surah: playLocation.surah, ayah: playLocation.ayah });
            setIsPlaying(true);
            onPlayComplete();
        }
    }, [playLocation, onPlayComplete, selectedSurahNumber, isBookMode, findPageForAyah, currentPage]);

    // Effect for real-time highlighting
    useEffect(() => {
        if (highlightedAyahRef.current) {
            highlightedAyahRef.current.style.backgroundColor = 'transparent';
            highlightedAyahRef.current = null;
        }

        if (currentAyah && isPlaying) {
            const ayahElement = document.getElementById(`ayah-${currentAyah.surah}-${currentAyah.ayah}`);
            if (ayahElement) {
                ayahElement.style.backgroundColor = 'rgba(74, 222, 128, 0.3)';
                ayahElement.style.transition = 'background-color 0.3s ease';
                ayahElement.style.borderRadius = '6px';
                
                if (!isBookMode) {
                   ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                highlightedAyahRef.current = ayahElement;
            }
        }
    }, [currentAyah, isPlaying, isBookMode]);

    const playAyah = useCallback(async (surahNum: number, ayahNum: number) => {
        const audio = audioRef.current;
        if (!audio) return;
    
        setError(null);
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/${selectedReciter}`);
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const data = await response.json();
            if (data.code !== 200 || !data.data || !data.data.audio) throw new Error('Invalid audio data from API.');
    
            audio.src = data.data.audio;
            await audio.play();
        } catch (e) {
            console.error("Audio playback error:", e);
            setError("حدث خطأ أثناء تشغيل الصوت. قد لا يكون للقارئ الحالي تلاوة لهذه الآية.");
            setIsPlaying(false);
        }
    }, [selectedReciter]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying && currentAyah) {
            playAyah(currentAyah.surah, currentAyah.ayah);
        } else {
            audio.pause();
        }
    }, [isPlaying, currentAyah, playAyah]);
    
    const handlePlayNext = useCallback(() => {
        if (!currentAyah || !quranData.length) return;
        
        const surahIndex = quranData.findIndex(s => s.number === currentAyah.surah);
        if (surahIndex === -1) return;
        
        const surahData = quranData[surahIndex];
        const isLastAyahInSurah = currentAyah.ayah === surahData.ayahs.length;

        let nextAyahLoc;
        if (isLastAyahInSurah) {
            // Stop at the end of the Quran
            if (currentAyah.surah === 114) {
                setIsPlaying(false);
                setCurrentAyah(null);
                return;
            }
            // Move to next surah
            const nextSurah = quranData[surahIndex + 1];
            nextAyahLoc = { surah: nextSurah.number, ayah: 1 };
            setSelectedSurahNumber(nextSurah.number);
        } else {
            // Move to next ayah
            nextAyahLoc = { surah: currentAyah.surah, ayah: currentAyah.ayah + 1 };
        }

        if (isBookMode) {
            const newPage = findPageForAyah(nextAyahLoc.ayah);
            if (newPage !== -1 && newPage !== currentPage) {
                setCurrentPage(newPage);
            }
        }
        setCurrentAyah(nextAyahLoc);

    }, [currentAyah, quranData, isBookMode, pages, currentPage, findPageForAyah]);

    const handlePlayPrev = () => {
        if (!currentAyah) return;

        let prevAyahLoc;
        if (currentAyah.ayah > 1) {
            prevAyahLoc = { surah: currentAyah.surah, ayah: currentAyah.ayah - 1 };
        } else if (currentAyah.surah > 1) {
            const prevSurahIndex = quranData.findIndex(s => s.number === currentAyah.surah) -1;
            const prevSurah = quranData[prevSurahIndex];
            prevAyahLoc = { surah: prevSurah.number, ayah: prevSurah.ayahs.length };
            setSelectedSurahNumber(prevSurah.number);
        } else {
            return; // At the very beginning
        }
        
        if (isBookMode) {
             const newPage = findPageForAyah(prevAyahLoc.ayah);
            if (newPage !== -1 && newPage !== currentPage) {
                setCurrentPage(newPage);
            }
        }
        setCurrentAyah(prevAyahLoc);
    };
    
    const handleTogglePlay = () => {
        if (!isPlaying && !currentAyah && selectedSurah) {
            setCurrentAyah({ surah: selectedSurah.number, ayah: isBookMode ? (pages[currentPage - 1]?.[0]?.number || 1) : 1 });
        }
        setIsPlaying(prev => !prev);
    };

    const handleStop = () => {
        setIsPlaying(false);
        setCurrentAyah(null);
    };

    if (isLoading) {
        return <div className="bg-gradient-to-br from-green-50 to-yellow-50 dark:from-green-900/50 dark:to-yellow-900/50 rounded-xl border border-yellow-200 dark:border-yellow-700/50 flex items-center justify-center h-full"><p className="text-yellow-600 dark:text-yellow-300 text-lg animate-pulse">جارِ تحميل القرآن الكريم...</p></div>;
    }

    return (
        <div className="relative quran-background dark:bg-gray-900 rounded-xl border border-yellow-300/50 dark:border-yellow-600/50 flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b border-yellow-300/50 dark:border-yellow-600/50 z-10 bg-white/50 dark:bg-black/30 backdrop-blur-sm">
                <h2 className="text-lg md:text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-yellow-600 dark:from-green-400 dark:to-yellow-400">القرآن الكريم</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <select value={selectedSurahNumber} onChange={(e) => setSelectedSurahNumber(Number(e.target.value))} className="w-full p-2 bg-white/50 dark:bg-black/20 border border-yellow-300/50 dark:border-yellow-600/50 rounded-lg text-yellow-800 dark:text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                        {quranData.map(surah => <option key={surah.number} value={surah.number}>{`${surah.number}. ${surah.name}`}</option>)}
                    </select>
                     <div className="flex gap-2">
                        <select value={selectedReciter} onChange={e => setSelectedReciter(e.target.value)} className="flex-grow p-2 bg-white/50 dark:bg-black/20 border border-yellow-300/50 dark:border-yellow-600/50 rounded-lg text-yellow-800 dark:text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                            {RECITERS.map(reciter => <option key={reciter.id} value={reciter.id}>{reciter.name}</option>)}
                        </select>
                        <button onClick={() => setIsBookMode(prev => !prev)} className={`px-3 flex-shrink-0 rounded-lg border transition-colors ${isBookMode ? 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-400 text-yellow-600 dark:text-yellow-300' : 'bg-white/50 dark:bg-black/20 border-yellow-300/50 dark:border-yellow-600/50 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30'}`} aria-label="Book Mode">
                            <BookIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                 {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}
            </div>

            <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
            {selectedSurah && (
                isBookMode ? (
                    <div className="p-6 font-quran text-xl md:text-2xl text-center leading-loose text-gray-800 dark:text-gray-100" dir="rtl">
                       {selectedSurah.number !== 1 && selectedSurah.number !== 9 && <p className="text-center w-full mb-4 text-green-700 dark:text-green-300">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>}
                       {pages[currentPage - 1]?.map((ayah: any) => (
                            <span id={`ayah-${selectedSurah.number}-${ayah.number}`} key={ayah.number} className="p-1">
                                {ayah.text}
                                <span className="text-sm font-sans text-yellow-600 dark:text-yellow-400 mx-1">{`﴿${ayah.number.toLocaleString('ar-EG')}﴾`}</span>
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 font-quran text-xl md:text-2xl text-center leading-loose text-gray-800 dark:text-gray-100" dir="rtl">
                        {selectedSurah.number !== 1 && selectedSurah.number !== 9 && <p className="text-center w-full mb-4 text-green-700 dark:text-green-300">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>}
                        {selectedSurah.ayahs.map((ayah: any) => (
                            <span id={`ayah-${selectedSurah.number}-${ayah.number}`} key={ayah.number} className="p-1">
                                {ayah.text}
                                <span className="text-sm font-sans text-yellow-600 dark:text-yellow-400 mx-1">{`﴿${ayah.number.toLocaleString('ar-EG')}﴾`}</span>
                            </span>
                        ))}
                    </div>
                )
            )}
            </div>

            <audio ref={audioRef} onEnded={handlePlayNext} />
            
            <div className="p-2 border-t border-yellow-300/50 dark:border-yellow-600/50 bg-white/50 dark:bg-black/30 backdrop-blur-sm z-10">
                {isBookMode && totalPages > 0 && (
                     <div className="flex items-center justify-center gap-4 mb-2 text-yellow-700 dark:text-yellow-300">
                        <button onClick={() => handlePageChange('next')} disabled={currentPage === totalPages} className="p-1 rounded-full hover:bg-yellow-400/20 disabled:opacity-30"><ChevronRightIcon className="w-5 h-5"/></button>
                        <span className="text-sm font-mono">{currentPage} / {totalPages}</span>
                        <button onClick={() => handlePageChange('prev')} disabled={currentPage === 1} className="p-1 rounded-full hover:bg-yellow-400/20 disabled:opacity-30"><ChevronLeftIcon className="w-5 h-5"/></button>
                    </div>
                )}
                <div className="max-w-xs mx-auto flex items-center justify-around gap-2 text-yellow-800 dark:text-yellow-200">
                     <button onClick={handleStop} className="p-2 rounded-full hover:bg-yellow-400/20 transition-colors" aria-label="إيقاف"><StopCircleIcon className="w-6 h-6" /></button>
                     <button onClick={handlePlayPrev} disabled={!currentAyah} className="p-2 rounded-full hover:bg-yellow-400/20 transition-colors disabled:opacity-50" aria-label="الآية السابقة"><SkipBackIcon className="w-6 h-6" /></button>
                     <button onClick={handleTogglePlay} className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-yellow-500 text-white hover:opacity-90 transition-opacity shadow-lg" aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}>
                        {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7 ml-1" />}
                     </button>
                     <button onClick={handlePlayNext} disabled={!currentAyah} className="p-2 rounded-full hover:bg-yellow-400/20 transition-colors disabled:opacity-50" aria-label="الآية التالية"><SkipForwardIcon className="w-6 h-6" /></button>
                     <div className="w-10 h-10 flex-shrink-0"></div>
                </div>
            </div>
        </div>
    );
};