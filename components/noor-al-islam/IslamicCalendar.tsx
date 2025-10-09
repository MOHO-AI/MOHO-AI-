import React, { useState, useEffect } from 'react';
import { fetchHijriCalendar } from './api';
import { LoaderIcon, ChevronLeftIcon, ChevronRightIcon } from '../Icons';

interface CalendarDay {
    date: {
        readable: string;
        hijri: {
            day: string;
            month: { number: number; ar: string; };
            year: string;
            holidays: string[];
        };
        gregorian: {
            day: string;
            month: { number: number; en: string; };
            year: string;
        };
    };
}

export const IslamicCalendar: React.FC = () => {
    const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [coords, setCoords] = useState<{lat: number, lon: number} | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
            },
            (geoError) => {
                console.error("Geolocation error:", geoError);
                // Fallback to a default location and inform the user if permission denied.
                setError("لم نتمكن من الوصول لموقعك. سيتم عرض التقويم لموقع افتراضي. يرجى تمكين خدمة الموقع لعرض تقويم دقيق لمنطقتك.")
                setCoords({ lat: 21.4225, lon: 39.8262 }); // Mecca fallback
            }
        );
    }, []);

    useEffect(() => {
        if (!coords) return; // Wait for coordinates

        const getCalendar = async () => {
            setIsLoading(true);
            if (!error?.includes("لم نتمكن")) {
                setError(null);
            }
            try {
                const data = await fetchHijriCalendar(year, month, coords.lat, coords.lon);
                setCalendarData(data);
            } catch (err: any) {
                setError('فشل في جلب بيانات التقويم.');
                setCalendarData([]); // Clear old data on error
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        getCalendar();
    }, [year, month, coords]);
    
    const handleMonthChange = (delta: number) => {
        const newDate = new Date(year, month - 1 + delta);
        setYear(newDate.getFullYear());
        setMonth(newDate.getMonth() + 1);
        setSelectedDay(null); // Reset selected day
    };

    const firstDayOfMonth = calendarData.length > 0 ? new Date(year, month - 1, 1).getDay() : 0;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    
    const hijriMonthDisplay = calendarData?.[15]?.date?.hijri; // Pick a day from middle of month

    return (
        <div className="h-full w-full overflow-y-auto p-2 sm:p-4 md:p-6 bg-[var(--token-surface-container)]">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-4">
                     <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-[var(--token-surface-container-high)]"><ChevronRightIcon className="w-6 h-6" /></button>
                     <div className="text-center">
                        <h1 className="text-xl font-bold text-[var(--token-on-surface)]">{new Date(year, month-1).toLocaleString('ar', { month: 'long', year: 'numeric' })}</h1>
                        <p className="text-sm text-[var(--token-on-surface-variant)]">
                           {hijriMonthDisplay ? `${hijriMonthDisplay.month.ar} ${hijriMonthDisplay.year}` : (isLoading ? '...' : '-')}
                        </p>
                     </div>
                     <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-[var(--token-surface-container-high)]"><ChevronLeftIcon className="w-6 h-6" /></button>
                </header>

                {isLoading && <div className="flex justify-center items-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-[var(--token-primary)]" /></div>}
                {error && <p className="text-center text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>}
                
                {!isLoading && !error && calendarData.length > 0 && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                                <div key={day} className="font-semibold p-1 md:p-2 text-[11px] sm:text-sm text-[var(--token-on-surface-variant)]">{day}</div>
                            ))}
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                            {calendarData.map(day => {
                                const isToday = isCurrentMonth && parseInt(day.date.gregorian.day) === today.getDate();
                                const isSelected = selectedDay?.date.readable === day.date.readable;
                                const holidays = day.date.hijri.holidays;
                                return (
                                    <button 
                                        key={day.date.readable} 
                                        onClick={() => setSelectedDay(day)}
                                        className={`relative p-1 rounded-xl aspect-square flex flex-col transition-all text-right ${
                                            isSelected
                                                ? 'bg-[var(--token-primary)] text-[var(--token-on-primary)]'
                                                : isToday
                                                ? 'border-2 border-[var(--token-primary)]'
                                                : 'hover:bg-[var(--token-surface-container-high)]'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`font-bold text-base sm:text-xl ${isSelected ? 'text-white' : 'text-[var(--token-on-surface)]'}`}>{day.date.hijri.day}</span>
                                            <span className={`text-[9px] sm:text-xs ${isSelected ? 'text-white/80' : 'text-[var(--token-on-surface-variant)]'}`}>{day.date.gregorian.day}</span>
                                        </div>
                                        <div className="flex-grow"></div>
                                        {holidays.length > 0 && (
                                            <div className="w-full mt-auto">
                                                <div className={`h-1.5 w-full rounded-full ${isSelected ? 'bg-white/50' : 'bg-green-500'}`} title={holidays.join(', ')}></div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {selectedDay && (
                            <div className="mt-4 p-4 bg-[var(--token-surface-container-high)] rounded-2xl animate-fade-in">
                                <h3 className="font-bold text-lg text-[var(--token-on-surface)] mb-2">
                                    {new Date(parseInt(selectedDay.date.gregorian.year, 10), selectedDay.date.gregorian.month.number - 1, parseInt(selectedDay.date.gregorian.day, 10)).toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </h3>
                                <p className="text-[var(--token-on-surface-variant)] mb-3">
                                    يوافق {selectedDay.date.hijri.day} {selectedDay.date.hijri.month.ar} {selectedDay.date.hijri.year} هـ
                                </p>
                                {selectedDay.date.hijri.holidays.length > 0 ? (
                                    <div>
                                        <h4 className="font-semibold text-sm text-[var(--token-on-surface)] mb-1">المناسبات الدينية:</h4>
                                        <ul className="list-disc list-inside text-[var(--token-on-surface-variant)] space-y-1">
                                            {selectedDay.date.hijri.holidays.map((holiday, index) => (
                                                <li key={index}>{holiday}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--token-on-surface-variant)]">لا توجد مناسبات دينية في هذا اليوم.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};