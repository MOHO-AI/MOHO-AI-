import React, { useState, useEffect } from 'react';
import { fetchPrayerTimes, fetchPrayerTimesByCity } from './api';
import { PrayerData } from '../../types';
import { LoaderIcon, ClockIcon } from '../Icons';

const PRAYER_NAMES: { [key: string]: string } = {
    Fajr: 'الفجر',
    Sunrise: 'الشروق',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء',
};

const PrayerIcon: React.FC<{ prayer: string }> = ({ prayer }) => {
    const iconPath = {
        Fajr: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
        Dhuhr: "M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4",
        Asr: "M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4",
        Maghrib: "M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4",
        Isha: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",
        Sunrise: "M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4",
    }[prayer];

    const isSun = ['Dhuhr', 'Asr', 'Sunrise'].includes(prayer);
    const isMoon = ['Fajr', 'Isha', 'Maghrib'].includes(prayer);
    
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 ${isSun ? 'text-yellow-500' : ''} ${isMoon ? 'text-blue-400' : ''}`}>
        <path d={iconPath} />
      </svg>
    );
};


export const PrayerTimes: React.FC = () => {
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; countdown: string } | null>(null);
    const [manualCity, setManualCity] = useState('');
    const [manualCountry, setManualCountry] = useState('');

    const getPrayerTimes = async (coords?: GeolocationCoordinates) => {
        setIsLoading(true);
        setError(null);
        try {
            let data;
            if (coords) {
                data = await fetchPrayerTimes(coords.latitude, coords.longitude);
            } else if(manualCity && manualCountry) {
                data = await fetchPrayerTimesByCity(manualCity, manualCountry);
            } else {
                 setError("يرجى السماح بالوصول إلى الموقع أو إدخال مدينة وبلد.");
                 setIsLoading(false);
                 return;
            }
            setPrayerData(data);
        } catch (err: any) {
            setError(err.message || 'فشل في جلب أوقات الصلاة. يرجى التحقق من اسم المدينة والبلد.');
            setPrayerData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                getPrayerTimes(position.coords);
            },
            (geoError) => {
                console.error("Geolocation error:", geoError);
                setError("لم نتمكن من الوصول لموقعك. يمكنك إدخال مدينتك يدويًا.");
                setIsLoading(false);
            }
        );
    }, []);

    useEffect(() => {
        if (!prayerData) return;

        const interval = setInterval(() => {
            const now = new Date();
            let nextPrayerTime = Infinity;
            let nextPrayerName = '';
            
            Object.entries(prayerData.timings).forEach(([name, time]) => {
                if (PRAYER_NAMES[name] && name !== 'Sunrise') {
                    const [hour, minute] = (time as string).split(':').map(Number);
                    const prayerDate = new Date();
                    prayerDate.setHours(hour, minute, 0, 0);
                    
                    if (prayerDate.getTime() > now.getTime() && prayerDate.getTime() < nextPrayerTime) {
                        nextPrayerTime = prayerDate.getTime();
                        nextPrayerName = name;
                    }
                }
            });

            if (nextPrayerName) {
                const diff = nextPrayerTime - now.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setNextPrayer({
                    name: PRAYER_NAMES[nextPrayerName],
                    time: prayerData.timings[nextPrayerName],
                    countdown: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
                });
            } else {
                // All prayers for today passed, calculate time until tomorrow's Fajr
                const [fajrHour, fajrMinute] = prayerData.timings.Fajr.split(':').map(Number);
                const tomorrowFajr = new Date();
                tomorrowFajr.setDate(now.getDate() + 1);
                tomorrowFajr.setHours(fajrHour, fajrMinute, 0, 0);

                const diff = tomorrowFajr.getTime() - now.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setNextPrayer({
                    name: `الفجر`,
                    time: prayerData.timings.Fajr,
                    countdown: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [prayerData]);
    
    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        getPrayerTimes();
    };

    return (
        <div className="h-full w-full overflow-y-auto p-4 md:p-6 bg-[var(--token-surface-container)]">
            <div className="max-w-lg mx-auto">
                <h1 className="text-2xl font-bold text-center text-[var(--token-on-surface)] mb-4">أوقات الصلاة</h1>
                
                <form onSubmit={handleManualSearch} className="mb-6 flex flex-col sm:flex-row gap-2">
                    <input type="text" value={manualCity} onChange={e => setManualCity(e.target.value)} placeholder="المدينة (مثال: Mecca)" className="form-input" />
                    <input type="text" value={manualCountry} onChange={e => setManualCountry(e.target.value)} placeholder="البلد (مثال: Saudi Arabia)" className="form-input" />
                    <button type="submit" className="btn bg-[var(--token-primary)] text-[var(--token-on-primary)] hover:opacity-90">بحث</button>
                </form>

                {isLoading && (
                    <div className="flex justify-center items-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-[var(--token-primary)]" /></div>
                )}
                {error && <p className="text-center text-red-500 bg-red-500/10 p-3 rounded-lg">{error}</p>}
                
                {prayerData && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="text-center p-4 bg-[var(--token-surface-container-high)] rounded-2xl">
                            <p className="font-semibold text-lg text-[var(--token-on-surface)]">{prayerData.location}</p>
                            <p className="text-sm text-[var(--token-on-surface-variant)]">{prayerData.date.gregorian.date}</p>
                            <p className="text-sm text-[var(--token-on-surface-variant)]">{`${prayerData.date.hijri.weekday.ar}, ${prayerData.date.hijri.date} ${prayerData.date.hijri.month.ar} ${prayerData.date.hijri.year}`}</p>
                        </div>

                        {nextPrayer && (
                            <div className="p-6 bg-[var(--token-primary-container)] text-[var(--token-on-primary-container)] rounded-3xl shadow-lg text-center">
                                <p className="text-lg font-medium">الصلاة القادمة</p>
                                <p className="text-4xl font-bold my-1">{nextPrayer.name}</p>
                                <div className="flex items-center justify-center gap-2 text-lg opacity-90">
                                    <ClockIcon className="w-5 h-5" />
                                    <span>{nextPrayer.time}</span>
                                </div>
                                <p className="font-mono text-xl mt-2">متبقي: {nextPrayer.countdown}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            {Object.entries(PRAYER_NAMES).map(([key, name]) => (
                                <div key={key} className={`flex items-center justify-between p-4 rounded-xl transition-all ${nextPrayer?.name.includes(PRAYER_NAMES[key]) ? 'bg-[var(--token-secondary-container)]' : 'bg-[var(--token-surface-container-high)]'}`}>
                                    <div className="flex items-center gap-3">
                                        <PrayerIcon prayer={key} />
                                        <span className={`font-semibold ${nextPrayer?.name.includes(PRAYER_NAMES[key]) ? 'text-[var(--token-on-secondary-container)]' : 'text-[var(--token-on-surface)]'}`}>{name}</span>
                                    </div>
                                    <span className={`font-mono text-xl ${nextPrayer?.name.includes(PRAYER_NAMES[key]) ? 'text-[var(--token-on-secondary-container)]' : 'text-[var(--token-on-surface-variant)]'}`}>{prayerData.timings[key]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};