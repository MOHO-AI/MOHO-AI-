
let cachedQuranData: any | null = null;
const QURAN_API_URL = 'https://api.alquran.cloud/v1/quran/quran-uthmani';

export const fetchQuranData = async () => {
  if (cachedQuranData) {
    return cachedQuranData;
  }
  try {
    const response = await fetch(QURAN_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch Quran data: ${response.statusText}`);
    }
    const json = await response.json();
    if (json.code !== 200 || !json.data.surahs) {
      throw new Error('Invalid API response format from alquran.cloud');
    }
    
    const surahs = json.data.surahs.map((surah: any) => ({
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      revelationType: surah.revelationType,
      ayahs: surah.ayahs.map((ayah: any) => ({
        number: ayah.numberInSurah,
        text: ayah.text,
      })),
    }));

    cachedQuranData = surahs;
    return surahs;
  } catch (error) {
    console.error("Error fetching or parsing Quran data:", error);
    throw error;
  }
};