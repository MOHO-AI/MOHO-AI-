import React from 'react';

export enum ModelId {
  ADAPTIVE = 'ADAPTIVE',
  QUALITY = 'QUALITY',
  RESEARCHER = 'RESEARCHER',
  SOCIAL = 'SOCIAL',
}

export enum ThinkingMode {
    SPEED = 'SPEED',
    BALANCED = 'BALANCED',
    QUALITY = 'QUALITY',
}

export interface Attachment {
  name: string;
  mimeType: string;
  size: number;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  data: {
    labels: string[];
    datasets: any[];
  };
  options: any;
}

export interface PrayerData {
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    [key: string]: string;
  };
  date: {
    hijri: {
        date: string;
        day: string;
        weekday: { en: string; ar: string; };
        month: { en: string; ar: string; };
        year: string;
    };
    gregorian: {
        date: string;
    }
  };
  location: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  deepThinking?: DeepThinking | null;
  researchPlan?: string[] | null;
  isPlanExecuted?: boolean;
  sources?: Source[];
  chartData?: ChartData | null;
  designContent?: string | null;
  mermaidCodes?: string[] | null;
  qrCodeSVG?: string | null;
  callStatus?: 'calling' | 'completed' | null;
  whiteboardSteps?: WhiteboardStep[];
}

export interface WhiteboardStep {
  type: 'text' | 'latex' | 'mermaid' | 'html' | 'image' | 'svg' | 'generate_image' | 'image_loading';
  content: string;
}

export interface DeepThinking {
  method: string;
  plan: string[];
  duration?: number;
}

export interface Source {
  uri: string;
  title?: string;
}

// Fix: Define and export the HadithBook interface.
export interface HadithBook {
  name: string;
  hadiths: {
    hadithnumber: number | string;
    text: string;
  }[];
}

export interface QuranScrollLocation {
  surah: number;
  ayah: number;
}

export type Theme = 'light' | 'dark' | 'system';
export type FontFamily = 'sans' | 'serif' | 'sans-alt' | 'mono-alt';

// Weather App Types
export interface CurrentWeather {
  temp_c: number;
  condition: string;
  condition_icon: string; // e.g., 'sunny', 'cloudy'
  feelslike_c: number;
  humidity: number;
  wind_kph: number;
  pressure_mb: number;
  vis_km: number;
  sunrise: string;
  sunset: string;
  uv_index: number;
  air_quality_index: number;
  wind_direction: string;
}

export interface ForecastHour {
  time: string; // "HH:00"
  temp_c: number;
  condition_icon: string;
  chance_of_rain: number;
}

export interface ForecastDay {
  date: string;
  maxtemp_c: number;
  mintemp_c: number;
  condition: string;
  condition_icon: string;
}

export interface WeatherData {
  location: string;
  current: CurrentWeather;
  forecast_hourly: ForecastHour[];
  forecast_daily: ForecastDay[];
}