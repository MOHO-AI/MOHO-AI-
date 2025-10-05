import React, { useState, useEffect } from 'react';
import { fetchWeatherData, fetchPrayerTimes } from './noor-al-islam/api';
import { WeatherData, PrayerData } from '../types';
import { WeatherConditionIcon, LoaderIcon, GlobeIcon, ClockIcon } from './Icons';

type WidgetStatus = 'loading_location' | 'loading_data' | 'success' | 'error';

const PRAYER_NAMES: { [key: string]: string } = {
    Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
};

export const StatusWidget: React.FC<{ type: 'weather' | 'prayer' }> = ({ type }) => {
    const [status, setStatus] = useState<WidgetStatus>('loading_location');
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; countdown: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setStatus('loading_location');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setStatus('loading_data');
                try {
                    if (type === 'weather') {
                        const data = await fetchWeatherData(`${position.coords.latitude},${position.coords.longitude}`);
                        setWeatherData(data);
                    } else {
                        const data = await fetchPrayerTimes(position.coords.latitude, position.coords.longitude);
                        setPrayerData(data);
                    }
                    setStatus('success');
                } catch (err: any) {
                    setError('فشل في جلب البيانات.');
                    setStatus('error');
                }
            },
            (geoError) => {
                setError('يرجى السماح بالوصول للموقع.');
                setStatus('error');
            }
        );
    }, [type]);

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
                const [fajrHour, fajrMinute] = prayerData.timings.Fajr.split(':').map(Number);
                const tomorrowFajr = new Date();
                tomorrowFajr.setDate(now.getDate() + 1);
                tomorrowFajr.setHours(fajrHour, fajrMinute, 0, 0);
                const diff = tomorrowFajr.getTime() - now.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setNextPrayer({ name: 'الفجر', time: prayerData.timings.Fajr, countdown: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [prayerData]);

    const renderContent = () => {
        switch (status) {
            case 'loading_location':
                return <><GlobeIcon className="w-5 h-5 animate-pulse" /><span>جاري تحميل الموقع الجغرافي...</span></>;
            case 'loading_data':
                return <><LoaderIcon className="w-5 h-5 animate-spin" /><span>جاري تحميل البيانات...</span></>;
            case 'error':
                return <span className="text-red-500">{error}</span>;
            case 'success':
                if (type === 'weather' && weatherData) {
                    return (
                        <div className="flex items-center justify-between w-full">
                            <div className="text-right">
                                <p className="font-semibold text-sm">{weatherData.location.split(',')[0]}</p>
                                <p className="text-xs opacity-80">{weatherData.current.condition}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-3xl font-bold">{Math.round(weatherData.current.temp_c)}°</p>
                                <WeatherConditionIcon icon={weatherData.current.condition_icon} className="w-8 h-8" />
                            </div>
                        </div>
                    );
                }
                if (type === 'prayer' && prayerData && nextPrayer) {
                     return (
                        <div className="flex items-center justify-between w-full">
                             <div className="text-right">
                                <p className="font-semibold text-sm">{prayerData.location.split(',')[0]}</p>
                                <p className="text-xs opacity-80">متبقي: {nextPrayer.countdown}</p>
                            </div>
                            <div className="flex items-center gap-2 text-center">
                                 <div>
                                    <p className="text-xl font-bold">{nextPrayer.name}</p>
                                    <p className="text-xs font-mono">{nextPrayer.time}</p>
                                </div>
                               <ClockIcon className="w-7 h-7" />
                            </div>
                        </div>
                    );
                }
                return null;
        }
    };

    return (
        <div className="my-2 p-3 w-full max-w-sm mx-auto bg-[var(--token-main-surface-secondary)] border border-[var(--token-border-default)] rounded-full shadow-md flex items-center justify-center gap-2 text-sm text-[var(--token-text-secondary)]">
            {renderContent()}
        </div>
    );
};
