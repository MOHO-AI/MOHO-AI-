import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeftIcon, LoaderIcon, SunIcon, MoonIcon, WindIcon, ThermometerIcon, SunriseIcon, SunsetIcon, CompassIcon, GaugeIcon, DropletIcon, EyeIcon, WeatherConditionIcon } from './Icons';
import { WeatherData } from '../types';
import { fetchWeatherData } from './noor-al-islam/api';

interface WeatherAppProps {
    onBack: () => void;
}

const getDynamicBackground = (icon?: string, sunrise?: string, sunset?: string): string => {
    if (!icon || !sunrise || !sunset) {
        return 'linear-gradient(to top, #30496B, #1E2D4A)'; // Default night
    }

    const now = new Date();
    const [sunriseH, sunriseM] = sunrise.split(':').map(Number);
    const sunriseDate = new Date();
    sunriseDate.setHours(sunriseH, sunriseM);

    const [sunsetH, sunsetM] = sunset.split(':').map(Number);
    const sunsetDate = new Date();
    sunsetDate.setHours(sunsetH, sunsetM);

    const isDay = now > sunriseDate && now < sunsetDate;

    const gradients = {
        day: {
            sunny: 'linear-gradient(to top, #4A90E2, #87CEEB)',
            cloudy: 'linear-gradient(to top, #B0C4DE, #778899)',
            rain: 'linear-gradient(to top, #6A7F93, #435467)',
            thunderstorm: 'linear-gradient(to top, #464057, #2E2A3A)',
            snow: 'linear-gradient(to top, #E6E9F0, #FFFFFF)',
        },
        night: {
            clear: 'linear-gradient(to top, #0F2027, #203A43, #2C5364)',
            cloudy: 'linear-gradient(to top, #323C48, #232B34)',
            rain: 'linear-gradient(to top, #29323C, #1C2228)',
            thunderstorm: 'linear-gradient(to top, #282434, #1C1A24)',
            snow: 'linear-gradient(to top, #3E5151, #1C2525)',
        }
    };
    
    if (isDay) {
        if (icon.includes('sunny') || icon.includes('clear')) return gradients.day.sunny;
        if (icon.includes('cloudy')) return gradients.day.cloudy;
        if (icon.includes('rain')) return gradients.day.rain;
        if (icon.includes('thunderstorm')) return gradients.day.thunderstorm;
        if (icon.includes('snow') || icon.includes('sleet')) return gradients.day.snow;
        return gradients.day.cloudy;
    } else {
        if (icon.includes('clear')) return gradients.night.clear;
        if (icon.includes('cloudy')) return gradients.night.cloudy;
        if (icon.includes('rain')) return gradients.night.rain;
        if (icon.includes('thunderstorm')) return gradients.night.thunderstorm;
        if (icon.includes('snow') || icon.includes('sleet')) return gradients.night.snow;
        return gradients.night.clear;
    }
};

const getUvIndexData = (uv: number) => {
    if (uv <= 2) return { level: 'منخفض', color: '#4CAF50', percentage: (uv / 11) * 100 };
    if (uv <= 5) return { level: 'متوسط', color: '#FFC107', percentage: (uv / 11) * 100 };
    if (uv <= 7) return { level: 'مرتفع', color: '#FF9800', percentage: (uv / 11) * 100 };
    if (uv <= 10) return { level: 'مرتفع جدًا', color: '#F44336', percentage: (uv / 11) * 100 };
    return { level: 'شديد الخطورة', color: '#9C27B0', percentage: (uv / 11) * 100 };
};

const getAqiData = (aqi: number) => {
    if (aqi <= 50) return { level: 'جيد', color: '#4CAF50', percentage: (aqi / 300) * 100 };
    if (aqi <= 100) return { level: 'متوسط', color: '#FFC107', percentage: (aqi / 300) * 100 };
    if (aqi <= 150) return { level: 'غير صحي للمجموعات الحساسة', color: '#FF9800', percentage: (aqi / 300) * 100 };
    if (aqi <= 200) return { level: 'غير صحي', color: '#F44336', percentage: (aqi / 300) * 100 };
    if (aqi <= 300) return { level: 'غير صحي للغاية', color: '#9C27B0', percentage: (aqi / 300) * 100 };
    return { level: 'خطير', color: '#795548', percentage: 100 };
};

const getWindDirectionRotation = (dir: string) => {
    const directions: { [key: string]: number } = {
        N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
        S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5
    };
    return directions[dir.toUpperCase()] || 0;
};

const DetailCard: React.FC<{ title: string; Icon: React.FC<any>; children: React.ReactNode; }> = ({ title, Icon, children }) => (
    <div className="p-4 bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 text-sm opacity-80 mb-2">
            <Icon className="w-4 h-4" />
            <span>{title}</span>
        </div>
        {children}
    </div>
);

export const WeatherApp: React.FC<WeatherAppProps> = ({ onBack }) => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const fetchWeather = useCallback(async (locationQuery: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchWeatherData(locationQuery);
            setWeatherData(data);
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع.');
            setWeatherData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeather(`${position.coords.latitude},${position.coords.longitude}`);
            },
            (err) => {
                setError('يرجى السماح بالوصول إلى الموقع أو البحث عن مدينة.');
                setIsLoading(false);
                // Fetch a default location if geolocation fails
                fetchWeather('Mecca');
            }
        );
    }, [fetchWeather]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            fetchWeather(query);
        }
    };
    
    const backgroundStyle = {
        background: weatherData ? getDynamicBackground(weatherData.current.condition_icon, weatherData.current.sunrise, weatherData.current.sunset) : 'linear-gradient(to top, #30496B, #1E2D4A)',
    };

    return (
         <div className="h-full w-full flex flex-col bg-cover bg-center text-white transition-all duration-1000" style={backgroundStyle}>
            <div className="relative h-full w-full flex flex-col">
                <header className="p-4 flex items-center justify-between flex-shrink-0 z-10">
                    <button onClick={onBack} className="p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"><ArrowLeftIcon className="w-6 h-6 transform scale-x-[-1]" /></button>
                    <h1 className="text-xl font-bold drop-shadow-md">الطقس</h1>
                    <div className="w-10"></div>
                </header>

                <main className="flex-1 overflow-y-auto px-4 pb-4">
                    <form onSubmit={handleSearch} className="mb-6">
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="ابحث عن مدينة..."
                            className="w-full p-3 bg-black/20 border border-white/20 rounded-full text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all backdrop-blur-sm"
                        />
                    </form>

                    {isLoading && <div className="flex justify-center items-center h-64"><LoaderIcon className="w-10 h-10 animate-spin" /></div>}
                    {error && <p className="text-center text-red-300 bg-red-500/30 p-4 rounded-xl">{error}</p>}
                    
                    {weatherData && (
                        <div className="space-y-6 animate-fade-in">
                             <div className="text-center flex flex-col items-center">
                                <h2 className="text-3xl font-bold drop-shadow-lg">{weatherData.location}</h2>
                                <p className="font-semibold text-lg drop-shadow-md mt-1">{weatherData.current.condition}</p>
                                <p className="text-8xl font-thin my-2 drop-shadow-xl">{Math.round(weatherData.current.temp_c)}°</p>
                                <p className="text-sm opacity-90">
                                    <span> الأعلى: {Math.round(weatherData.forecast_daily[0].maxtemp_c)}°</span>
                                    <span className="mx-2">|</span>
                                    <span> الأدنى: {Math.round(weatherData.forecast_daily[0].mintemp_c)}°</span>
                                </p>
                            </div>

                            <div className="p-4 bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl">
                                <h3 className="text-sm font-semibold opacity-80 mb-3 border-b border-white/20 pb-2">توقعات الساعات القادمة</h3>
                                <div className="flex overflow-x-auto gap-4 -mb-2 pb-2">
                                    {weatherData.forecast_hourly.map(hour => (
                                        <div key={hour.time} className="flex flex-col items-center gap-2 flex-shrink-0 w-16">
                                            <p className="text-xs opacity-80">{hour.time}</p>
                                            <WeatherConditionIcon icon={hour.condition_icon} className="w-8 h-8" />
                                            <p className="font-bold">{Math.round(hour.temp_c)}°</p>
                                            {hour.chance_of_rain > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-blue-200">
                                                   <DropletIcon className="w-3 h-3"/> <span>{hour.chance_of_rain}%</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                             <div className="p-4 bg-black/20 backdrop-blur-lg border border-white/10 rounded-2xl">
                                <h3 className="text-sm font-semibold opacity-80 mb-2 border-b border-white/20 pb-2">التوقعات للأيام القادمة</h3>
                                <div className="space-y-3">
                                    {weatherData.forecast_daily.map(day => (
                                        <div key={day.date} className="grid grid-cols-[1fr_auto_1fr] items-center text-sm gap-4">
                                            <p className="font-medium">{new Date(day.date).toLocaleDateString('ar', { weekday: 'long' })}</p>
                                            <WeatherConditionIcon icon={day.condition_icon} className="w-8 h-8 text-white/90" />
                                            <div className="flex justify-end items-center gap-3">
                                                <p className="font-semibold text-white/80 w-8 text-center">{Math.round(day.mintemp_c)}°</p>
                                                <div className="w-12 h-1.5 bg-white/20 rounded-full flex-shrink-0"></div>
                                                <p className="font-semibold w-8 text-center">{Math.round(day.maxtemp_c)}°</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <DetailCard title="مؤشر الأشعة" Icon={SunIcon}>
                                    <p className="font-bold text-2xl">{weatherData.current.uv_index}</p>
                                    <p style={{color: getUvIndexData(weatherData.current.uv_index).color}} className="font-semibold text-sm">{getUvIndexData(weatherData.current.uv_index).level}</p>
                                    <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                                        <div className="h-1.5 rounded-full" style={{ width: `${getUvIndexData(weatherData.current.uv_index).percentage}%`, backgroundColor: getUvIndexData(weatherData.current.uv_index).color }}></div>
                                    </div>
                                </DetailCard>
                                <DetailCard title="الرياح" Icon={WindIcon}>
                                     <div className="flex items-center gap-2">
                                        <CompassIcon className="w-8 h-8 text-white/70" style={{ transform: `rotate(${getWindDirectionRotation(weatherData.current.wind_direction)}deg)` }} />
                                        <div>
                                             <p className="font-bold text-2xl">{weatherData.current.wind_kph}<span className="text-sm"> كم/س</span></p>
                                             <p className="text-sm font-semibold">{weatherData.current.wind_direction}</p>
                                        </div>
                                    </div>
                                </DetailCard>
                                <DetailCard title="الشروق والغروب" Icon={SunriseIcon}>
                                     <div className="space-y-1">
                                        <div className="flex items-center gap-2"><SunriseIcon className="w-5 h-5"/> <span className="text-lg font-semibold">{weatherData.current.sunrise}</span></div>
                                        <div className="flex items-center gap-2 mt-1"><SunsetIcon className="w-5 h-5"/> <span className="text-lg font-semibold">{weatherData.current.sunset}</span></div>
                                    </div>
                                </DetailCard>
                                <DetailCard title="الإحساس الحراري" Icon={ThermometerIcon}>
                                     <p className="font-bold text-3xl">{Math.round(weatherData.current.feelslike_c)}°</p>
                                </DetailCard>
                                <DetailCard title="الرطوبة" Icon={DropletIcon}>
                                    <p className="font-bold text-3xl">{weatherData.current.humidity}%</p>
                                </DetailCard>
                                 <DetailCard title="جودة الهواء" Icon={GaugeIcon}>
                                     <p className="font-bold text-2xl">{weatherData.current.air_quality_index}</p>
                                     <p style={{color: getAqiData(weatherData.current.air_quality_index).color}} className="font-semibold text-xs truncate">{getAqiData(weatherData.current.air_quality_index).level}</p>
                                     <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                                         <div className="h-1.5 rounded-full" style={{ width: `${getAqiData(weatherData.current.air_quality_index).percentage}%`, backgroundColor: getAqiData(weatherData.current.air_quality_index).color }}></div>
                                     </div>
                                </DetailCard>
                                 <DetailCard title="الضغط" Icon={CompassIcon}>
                                    <p className="font-bold text-2xl">{weatherData.current.pressure_mb} <span className="text-sm">hPa</span></p>
                                </DetailCard>
                                <DetailCard title="الرؤية" Icon={EyeIcon}>
                                    <p className="font-bold text-2xl">{weatherData.current.vis_km} <span className="text-sm">كم</span></p>
                                </DetailCard>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};