import { PrayerData } from '../../types';

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