import React, { useState, useEffect, useRef } from 'react';
import { fetchPrayerTimes } from './noor-al-islam/api';
import { XIcon } from './Icons';
import { ADHAN_SOUNDS } from './noor-al-islam/AdhanSettings';

const PRAYER_NAMES: { [key: string]: string } = {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء',
};

export const AdhanNotifier: React.FC = () => {
    const [prayerTimes, setPrayerTimes] = useState<{ [key: string]: string } | null>(null);
    const [notification, setNotification] = useState<{ prayerName: string } | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        // Fetch prayer times only if notifications are globally enabled
        const globalEnabled = localStorage.getItem('adhan_global_enabled') === 'true';
        if (!globalEnabled) {
            // If disabled, ensure we don't proceed.
            // This check will be repeated inside the interval as well.
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const data = await fetchPrayerTimes(position.coords.latitude, position.coords.longitude);
                    setPrayerTimes(data.timings);
                } catch (error) {
                    console.error("Failed to fetch prayer times for notifications:", error);
                }
            },
            (error) => {
                console.error("Geolocation denied, cannot show prayer notifications:", error);
            }
        );
    }, []);

    useEffect(() => {
        if (!prayerTimes) return;

        const checkTime = () => {
            const globalEnabled = localStorage.getItem('adhan_global_enabled') === 'true';
            if (!globalEnabled) return;

            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            Object.entries(prayerTimes).forEach(([name, time]) => {
                const prayerSpecificEnabled = localStorage.getItem(`adhan_enabled_${name.toLowerCase()}`) !== 'false';

                if (PRAYER_NAMES[name] && prayerSpecificEnabled && time === currentTime) {
                    setNotification({ prayerName: PRAYER_NAMES[name] });
                    if (audioRef.current) {
                        const selectedSound = localStorage.getItem('adhan_sound') || ADHAN_SOUNDS[0].url;
                        audioRef.current.src = selectedSound;
                        audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
                    }
                }
            });
        };

        const interval = setInterval(checkTime, 60 * 1000);
        
        checkTime();

        return () => clearInterval(interval);
    }, [prayerTimes]);

    const closeNotification = () => {
        setNotification(null);
        audioRef.current?.pause();
        if(audioRef.current) audioRef.current.currentTime = 0;
    };
    
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                closeNotification();
            }, 5 * 60 * 1000); // 5 minutes
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (!notification) {
        return null;
    }

    return (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md p-4 animate-fade-in" style={{ animation: 'fadeInDown 0.5s ease-out' }}>
            <div className="relative w-full bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-3xl shadow-2xl overflow-hidden p-6 text-center">
                <div 
                    className="absolute inset-0 bg-no-repeat bg-cover opacity-10" 
                    style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath opacity=\'.5\' d=\'M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z\'/%3E%3Cpath d=\'M6 5V0h1v5h4V0h1v5h4V0h1v5h4V0h1v5h4V0h1v5h4V0h1v5h4V0h1v5h4V0h1v5h4V0h1v5h4V0h1v5h5v1h-5v4h5v1h-5v4h5v1h-5v4h5v1h-5v4h5v1h-5v4h5v1h-5v4h5v1h-5v4h5v1h-5v4h5v1h-5v4h5v1h-5v4h5v1h-5v5h-1v-5h-4v5h-1v-5h-4v5h-1v-5h-4v5h-1v-5h-4v5h-1v-5h-4v5h-1v-5h-4v5H6v-5H0v-1h6v-4H0v-1h6v-4H0v-1h6v-4H0v-1h6v-4H0v-1h6v-4H0v-1h6v-4H0v-1h6v-4H0v-1h6v-4H0v-1h6v-4H0v-1h6V6h-1V5h-1V4h1V3h1V2h-1V1h-1V0h-1v1H5v1H4v1H3v1H2v1H1v1H0v1h1v4H0v1h1v4H0v1h1v4H0v1h1v4H0v1h1v4H0v1h1v4H0v1h1v4H0v1h1v4h1v-4h4v4h1v-4h4v4h1v-4h4v4h1v-4h4v4h1v-4h4v4h1v-4h4v4h1v-4h4v4h1v-4h4v4h1v-4h4v4h1v-4h4v4h1v-4h4v4h1v-5h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h-1v-4h1v-h1v-1h1v-1h1v-1h1V6h-4V5zm-1 5v4h-4v-4h4zm-5 0v4h-4v-4h4zm-5 0v4h-4v-4h4zm-5 0v4h-4v-4h4zm-5 0v4h-4v-4h4zm-5 0v4h-4v-4h4zm-5 0v4h-4v-4h4zm-5 0v4h-4v-4h4zm-5 0v4h-4v-4h4zm-5 0v4h-4v-4h4zm-5 0v4h-4v-4h4zm-5 0v4h-4v-4h4zm-4-5h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm4-5v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-4-5h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm4-5v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-4-5h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm4-5v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-4-5h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm5 0h4v-4h-4v4zm4-5v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4zm-5 0v-4h-4v4h4z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} 
                />
                <button onClick={closeNotification} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-colors">
                    <XIcon className="w-5 h-5" />
                </button>
                <p className="text-lg font-medium opacity-80">حان الآن وقت</p>
                <h2 className="text-5xl font-bold my-1">أذان {notification.prayerName}</h2>
                <p className="opacity-80">حسب التوقيت المحلي لمدينتكم</p>
                <audio ref={audioRef} />
            </div>
            <style>
                {`
                @keyframes fadeInDown {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -100%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                }
                .animate-fade-in {
                    animation: fadeInDown 0.5s ease-out forwards;
                }
                `}
            </style>
        </div>
    );
};
