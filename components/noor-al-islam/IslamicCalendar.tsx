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
    
    const hijriMonthDisplay = calendarData?.[0]?.date?.hijri;

    return (
        <div className="h-full w-full overflow-y-auto p-2 sm:p-4 md:p-6 bg-gradient-to-br from-green-50 to-lime-100 dark:from-green-900/50 dark:to-lime-900/50">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-4">
                     <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronRightIcon className="w-6 h-6" /></button>
                     <div className="text-center">
                        <h1 className="text-xl font-bold text-green-800 dark:text-green-200">{new Date(year, month-1).toLocaleString('ar', { month: 'long', year: 'numeric' })}</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                           {hijriMonthDisplay ? `${hijriMonthDisplay.month.ar} ${hijriMonthDisplay.year}` : (isLoading ? '...' : '-')}
                        </p>
                     </div>
                     <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeftIcon className="w-6 h-6" /></button>
                </header>

                {isLoading && <div className="flex justify-center items-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-green-500" /></div>}
                {error && <p className="text-center text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>}
                
                {!isLoading && !error && calendarData.length > 0 && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map(day => (
                                <div key={day} className="font-semibold p-1 md:p-2 text-[11px] sm:text-sm text-green-700 dark:text-green-300">{day}</div>
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
                                        className={`relative p-1 rounded-lg aspect-square flex flex-col transition-all border-2 text-right ${
                                            isSelected
                                                ? 'border-green-500 bg-green-100 dark:bg-green-800/50'
                                                : isToday
                                                ? 'bg-green-200 dark:bg-green-700/50 border-green-400 dark:border-green-500'
                                                : 'bg-white/40 dark:bg-black/10 border-transparent hover:bg-white/80 dark:hover:bg-black/20'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-base sm:text-xl text-gray-800 dark:text-gray-200">{day.date.hijri.day}</span>
                                            <span className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400">{day.date.gregorian.day}</span>
                                        </div>
                                        <div className="flex-grow"></div>
                                        {holidays.length > 0 && (
                                            <div className="w-full mt-auto">
                                                <div className="h-1.5 w-full bg-green-500 rounded-full" title={holidays.join(', ')}></div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {selectedDay && (
                            <div className="mt-4 p-4 bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/50 dark:border-black/20 animate-fade-in">
                                <h3 className="font-bold text-lg text-green-800 dark:text-green-200 mb-2">
                                    {/* Fix: Convert the `year` string to a number before passing it to the `Date` constructor. */}
                                    {new Date(parseInt(selectedDay.date.gregorian.year, 10), selectedDay.date.gregorian.month.number - 1, parseInt(selectedDay.date.gregorian.day, 10)).toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-3">
                                    يوافق {selectedDay.date.hijri.day} {selectedDay.date.hijri.month.ar} {selectedDay.date.hijri.year} هـ
                                </p>
                                {selectedDay.date.hijri.holidays.length > 0 ? (
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-200 mb-1">المناسبات الدينية:</h4>
                                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                                            {selectedDay.date.hijri.holidays.map((holiday, index) => (
                                                <li key={index}>{holiday}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد مناسبات دينية في هذا اليوم.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};