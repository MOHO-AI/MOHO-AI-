import React from 'react';

export enum ModelId {
  ADAPTIVE = 'ADAPTIVE',
  QUALITY = 'QUALITY',
  RESEARCHER = 'RESEARCHER',
  QURAN = 'QURAN',
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

// FIX: Add missing PrayerData interface to fix type errors in PrayerTimes.tsx.
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
  date: string;
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

export interface QuranScrollLocation {
  surah: number;
  ayah: number;
}

export type Theme = 'light' | 'dark' | 'system';
export type FontFamily = 'sans' | 'serif' | 'sans-alt' | 'mono-alt';