import { PrayerData, WeatherData } from '../../types';

const ALADHAN_API_BASE = 'https://api.aladhan.com/v1';
// Fix: Add base URL for Sunnah.com API
const SUNNAH_API_BASE = 'https://sunnah.com/api';

export const fetchPrayerTimes = async (latitude: number, longitude: number): Promise<PrayerData> => {
    const response = await fetch(`${ALADHAN_API_BASE}/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
    if (!response.ok) throw new Error('Network response was not ok');
    const json = await response.json();
    if (json.code !== 200) throw new Error(json.data || 'Error fetching prayer times');
    
    // Reverse geocode to get location name
    const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
    let location = 'موقع حالي';
    if(geoResponse.ok) {
        const geoJson = await geoResponse.json();
        const { country, state, city, town, village } = geoJson.address;
        location = [country, state, city || town || village].filter(Boolean).join(' / ');
    }

    return { ...json.data, location };
};

export const fetchPrayerTimesByCity = async (city: string, country: string): Promise<PrayerData> => {
    const response = await fetch(`${ALADHAN_API_BASE}/timingsByCity?city=${city}&country=${country}&method=2`);
    if (!response.ok) throw new Error('Network response was not ok');
    const json = await response.json();
    if (json.code !== 200) throw new Error(json.data || 'Error fetching prayer times for city');
    return { ...json.data, location: `${country} / ${city}` };
}

export const fetchHijriCalendar = async (year: number, month: number, latitude?: number, longitude?: number) => {
    const lat = latitude || 36.7753; // Fallback to Algiers
    const lon = longitude || 3.0601;
    const response = await fetch(`${ALADHAN_API_BASE}/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}&method=2`);
     if (!response.ok) throw new Error('Network response was not ok');
    const json = await response.json();
    if (json.code !== 200) throw new Error(json.data || 'Error fetching calendar');
    return json.data;
};

// Fix: Implement and export function to fetch Hadith books for a collection.
export const fetchHadithBooksForCollection = async (collectionName: string) => {
    const response = await fetch(`${SUNNAH_API_BASE}/collections/${collectionName}/books`);
    if (!response.ok) throw new Error('Network response was not ok');
    const json = await response.json();
    // Map the API response to the format expected by the HadithReader component.
    return json.books.map((book: any) => ({
        book_number: book.bookNumber,
        name: book.book.find((b: any) => b.lang === 'ar')?.name || 'Book Name Not Found'
    }));
};

// Fix: Implement and export function to fetch Hadiths for a specific book.
export const fetchHadithBook = async (collectionName: string, bookNumber: string) => {
    const response = await fetch(`${SUNNAH_API_BASE}/collections/${collectionName}/books/${bookNumber}/hadiths?limit=0`);
    if (!response.ok) throw new Error('Network response was not ok');
    const json = await response.json();
    // Map the API response to match component property expectations (e.g., hadithNumber -> hadithnumber).
    return {
        ...json,
        hadiths: json.hadiths.map((h: any) => ({
            hadithnumber: h.hadithNumber,
            text: h.text
        }))
    };
};

// --- Weather API Logic (Moved from WeatherApp.tsx) ---

const WMO_CODES: { [key: number]: { day: string; night: string; icon: string } } = {
    0: { day: 'صافية', night: 'صافية', icon: 'sunny' },
    1: { day: 'صافية غالبًا', night: 'صافية غالبًا', icon: 'partly-cloudy-day' },
    2: { day: 'غائم جزئيًا', night: 'غائم جزئيًا', icon: 'partly-cloudy-day' },
    3: { day: 'غائم', night: 'غائم', icon: 'cloudy' },
    45: { day: 'ضباب', night: 'ضباب', icon: 'fog' },
    48: { day: 'ضباب متجمد', night: 'ضباب متجمد', icon: 'fog' },
    51: { day: 'رذاذ خفيف', night: 'رذاذ خفيف', icon: 'rain' },
    53: { day: 'رذاذ متوسط', night: 'رذاذ متوسط', icon: 'rain' },
    55: { day: 'رذاذ كثيف', night: 'رذاذ كثيف', icon: 'rain' },
    61: { day: 'مطر خفيف', night: 'مطر خفيف', icon: 'rain' },
    63: { day: 'مطر متوسط', night: 'مطر متوسط', icon: 'rain' },
    65: { day: 'مطر غزير', night: 'مطر غزير', icon: 'rain' },
    71: { day: 'ثلج خفيف', night: 'ثلج خفيف', icon: 'snow' },
    73: { day: 'ثلج متوسط', night: 'ثلج متوسط', icon: 'snow' },
    75: { day: 'ثلج كثيف', night: 'ثلج كثيف', icon: 'snow' },
    80: { day: 'زخات خفيفة', night: 'زخات خفيفة', icon: 'rain' },
    81: { day: 'زخات متوسطة', night: 'زخات متوسطة', icon: 'rain' },
    82: { day: 'زخات عنيفة', night: 'زخات عنيفة', icon: 'rain' },
    95: { day: 'عاصفة رعدية', night: 'عاصفة رعدية', icon: 'thunderstorm' },
};

const mapWeatherCodeToCondition = (code: number, isDay: boolean): { condition: string, icon: string } => {
    const weather = WMO_CODES[code] || { day: 'غير معروف', night: 'غير معروف', icon: 'cloudy' };
    const conditionText = isDay ? weather.day : weather.night;
    let icon = weather.icon;
    if (!isDay && (icon === 'sunny' || icon === 'partly-cloudy-day')) {
        icon = icon.replace('-day', '-night');
        if (icon === 'sunny') icon = 'clear-night';
    }
    return { condition: conditionText, icon };
};

const convertWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((degrees / 22.5) % 16);
    return directions[index];
};

export const fetchWeatherData = async (locationQuery: string): Promise<WeatherData> => {
    // 1. Geocode locationQuery to get lat/lon
    const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=json&limit=1&accept-language=ar`);
    if (!geoResponse.ok) throw new Error('فشل في تحديد الموقع.');
    const geoData = await geoResponse.json();
    if (geoData.length === 0) throw new Error(`لم يتم العثور على موقع باسم "${locationQuery}".`);

    const { lat, lon, display_name } = geoData[0];
    
    // 2. Fetch weather and air quality data from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,surface_pressure,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=european_aqi`;
    
    const [weatherRes, airQualityRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(airQualityUrl),
    ]);
    
    if (!weatherRes.ok || !airQualityRes.ok) throw new Error('فشل في جلب بيانات الطقس من المصدر.');
    
    const weatherJson = await weatherRes.json();
    const airQualityJson = await airQualityRes.json();
    
    // 3. Map the data to our WeatherData structure
    const now = new Date();
    const currentHourIndex = weatherJson.hourly.time.findIndex((t: string) => new Date(t) >= now) || 0;
    
    const isDay = weatherJson.current.is_day === 1;

    const mappedData: WeatherData = {
        location: display_name,
        current: {
            temp_c: weatherJson.current.temperature_2m,
            condition: mapWeatherCodeToCondition(weatherJson.current.weather_code, isDay).condition,
            condition_icon: mapWeatherCodeToCondition(weatherJson.current.weather_code, isDay).icon,
            feelslike_c: weatherJson.hourly.apparent_temperature[currentHourIndex],
            humidity: weatherJson.hourly.relative_humidity_2m[currentHourIndex],
            wind_kph: weatherJson.current.wind_speed_10m,
            pressure_mb: weatherJson.hourly.surface_pressure[currentHourIndex],
            vis_km: 10, // Not available, using a default
            sunrise: new Date(weatherJson.daily.sunrise[0]).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            sunset: new Date(weatherJson.daily.sunset[0]).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            uv_index: weatherJson.daily.uv_index_max[0],
            air_quality_index: airQualityJson.hourly.european_aqi[currentHourIndex] || 0,
            wind_direction: convertWindDirection(weatherJson.current.wind_direction_10m),
        },
        forecast_hourly: weatherJson.hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((t: string, i: number) => {
            const index = currentHourIndex + i;
            const hourDate = new Date(t);
            const isDayHour = hourDate > new Date(weatherJson.daily.sunrise[0]) && hourDate < new Date(weatherJson.daily.sunset[0]);
            return {
                time: hourDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                temp_c: weatherJson.hourly.temperature_2m[index],
                condition_icon: mapWeatherCodeToCondition(weatherJson.hourly.weather_code[index], isDayHour).icon,
                chance_of_rain: weatherJson.hourly.precipitation_probability[index],
            };
        }),
        forecast_daily: weatherJson.daily.time.map((d: string, i: number) => {
             return {
                date: d,
                maxtemp_c: weatherJson.daily.temperature_2m_max[i],
                mintemp_c: weatherJson.daily.temperature_2m_min[i],
                condition: mapWeatherCodeToCondition(weatherJson.daily.weather_code[i], true).condition,
                condition_icon: mapWeatherCodeToCondition(weatherJson.daily.weather_code[i], true).icon,
            };
        }),
    };

    return mappedData;
};