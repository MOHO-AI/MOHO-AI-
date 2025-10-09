import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeftIcon, LoaderIcon, GlobeIcon, ImagePlaceholderIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, SparkleIcon } from './Icons';
import { generateSimpleText } from '../services/geminiService';
import { ModelId } from '../types';

// --- Interfaces for API response structure ---
interface SearchResult {
    title: string;
    link: string;
    displayLink: string;
    snippet: string;
    pagemap?: {
        cse_thumbnail?: [{ src: string }];
        metatags?: [{ 'og:image': string }];
    };
}

interface ImageResult {
    link: string;
    title: string;
    snippet: string;
    image: {
        contextLink: string;
        thumbnailLink: string;
        height: number;
        width: number;
    };
}

interface SearchInformation {
    formattedTotalResults?: string;
    formattedSearchTime?: string;
    totalResults?: string;
}

interface ApiResponse {
    items?: (SearchResult | ImageResult)[];
    searchInformation?: SearchInformation;
    error?: { message: string };
}

// --- Constants for API ---
const API_KEY = 'AIzaSyDuANmT9zOGHLlueJzbeNxRyPbJfaEIWEc';
const SEARCH_ENGINE_ID = 'a5c216530dc2f4212';
const API_BASE_URL = 'https://www.googleapis.com/customsearch/v1';

// --- Animated Backgrounds ---
const BACKGROUNDS = [
    // Blue variants
    "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3e%3cdefs%3e%3cfilter id='blur-effect' x='-100%25' y='-100%25' width='300%25' height='300%25'%3e%3cfeGaussianBlur stdDeviation='100' in='SourceGraphic'/%3e%3c/filter%3e%3c/defs%3e%3cg filter='url(%23blur-effect)'%3e%3cg transform-origin='center center'%3e%3canimateTransform attributeName='transform' type='rotate' from='0' to='360' dur='177s' repeatCount='indefinite'/%3e%3cellipse cx='226' cy='595' rx='211' ry='312' fill='%23ADD8E6' opacity='0.9'%3e%3canimate attributeName='cx' values='226;13;199;226' dur='26s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='595;723;598;595' dur='37s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='211;258.9;211;' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='312;203.3;312;' dur='24s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='373' cy='317' rx='159' ry='194' fill='%23C5DFFF' opacity='0.9'%3e%3canimate attributeName='cx' values='373;182;218;373' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='317;363;187;317' dur='25s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='159;221.0;159;' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='194;184.2;194;' dur='34s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='668' cy='247' rx='312' ry='153' fill='%23C5DFFF' opacity='0.9'%3e%3canimate attributeName='cx' values='668;434;748;668' dur='24s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='247;442;463;247' dur='36s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='312;273.8;312;' dur='30s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='153;123.6;153;' dur='19s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='492' cy='282' rx='276' ry='184' fill='%23ADD8E6' opacity='0.9'%3e%3canimate attributeName='cx' values='492;352;266;492' dur='38s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='282;479;228;282' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='276;276.8;276;' dur='22s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='184;134.4;184;' dur='25s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='614' cy='655' rx='204' ry='258' fill='%23A8C7FA' opacity='0.9'%3e%3canimate attributeName='cx' values='614;427;726;614' dur='33s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='655;773;854;655' dur='35s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='204;135.1;204;' dur='31s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='258;357.5;258;' dur='22s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3c/g%3e%3c/g%3e%3c/svg%3e",
    "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3e%3cdefs%3e%3cfilter id='blur-effect' x='-100%25' y='-100%25' width='300%25' height='300%25'%3e%3cfeGaussianBlur stdDeviation='100' in='SourceGraphic'/%3e%3c/filter%3e%3c/defs%3e%3cg filter='url(%23blur-effect)'%3e%3cg transform-origin='center center'%3e%3canimateTransform attributeName='transform' type='rotate' from='0' to='360' dur='177s' repeatCount='indefinite'/%3e%3cellipse cx='226' cy='595' rx='211' ry='312' fill='%236A8EAE' opacity='0.9'%3e%3canimate attributeName='cx' values='226;13;199;226' dur='26s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='595;723;598;595' dur='37s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='211;258.9;211;' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='312;203.3;312;' dur='24s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='373' cy='317' rx='159' ry='194' fill='%2389A4C7' opacity='0.9'%3e%3canimate attributeName='cx' values='373;182;218;373' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='317;363;187;317' dur='25s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='159;221.0;159;' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='194;184.2;194;' dur='34s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='668' cy='247' rx='312' ry='153' fill='%2389A4C7' opacity='0.9'%3e%3canimate attributeName='cx' values='668;434;748;668' dur='24s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='247;442;463;247' dur='36s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='312;273.8;312;' dur='30s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='153;123.6;153;' dur='19s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='492' cy='282' rx='276' ry='184' fill='%236A8EAE' opacity='0.9'%3e%3canimate attributeName='cx' values='492;352;266;492' dur='38s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='282;479;228;282' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='276;276.8;276;' dur='22s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='184;134.4;184;' dur='25s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='614' cy='655' rx='204' ry='258' fill='%236E8AB7' opacity='0.9'%3e%3canimate attributeName='cx' values='614;427;726;614' dur='33s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='655;773;854;655' dur='35s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='204;135.1;204;' dur='31s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='258;357.5;258;' dur='22s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3c/g%3e%3c/g%3e%3c/svg%3e",
    "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3e%3cdefs%3e%3cfilter id='blur-effect' x='-100%25' y='-100%25' width='300%25' height='300%25'%3e%3cfeGaussianBlur stdDeviation='100' in='SourceGraphic'/%3e%3c/filter%3e%3c/defs%3e%3cg filter='url(%23blur-effect)'%3e%3cg transform-origin='center center'%3e%3canimateTransform attributeName='transform' type='rotate' from='0' to='360' dur='177s' repeatCount='indefinite'/%3e%3cellipse cx='226' cy='595' rx='211' ry='312' fill='%235F9EA0' opacity='0.9'%3e%3canimate attributeName='cx' values='226;13;199;226' dur='26s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='595;723;598;595' dur='37s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='211;258.9;211;' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='312;203.3;312;' dur='24s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='373' cy='317' rx='159' ry='194' fill='%2387CEEB' opacity='0.9'%3e%3canimate attributeName='cx' values='373;182;218;373' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='317;363;187;317' dur='25s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='159;221.0;159;' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='194;184.2;194;' dur='34s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='668' cy='247' rx='312' ry='153' fill='%2387CEEB' opacity='0.9'%3e%3canimate attributeName='cx' values='668;434;748;668' dur='24s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='247;442;463;247' dur='36s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='312;273.8;312;' dur='30s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='153;123.6;153;' dur='19s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='492' cy='282' rx='276' ry='184' fill='%235F9EA0' opacity='0.9'%3e%3canimate attributeName='cx' values='492;352;266;492' dur='38s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='282;479;228;282' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='276;276.8;276;' dur='22s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='184;134.4;184;' dur='25s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='614' cy='655' rx='204' ry='258' fill='%234682B4' opacity='0.9'%3e%3canimate attributeName='cx' values='614;427;726;614' dur='33s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='655;773;854;655' dur='35s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='204;135.1;204;' dur='31s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='258;357.5;258;' dur='22s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3c/g%3e%3c/g%3e%3c/svg%3e",
    "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3e%3cdefs%3e%3cfilter id='blur-effect' x='-100%25' y='-100%25' width='300%25' height='300%25'%3e%3cfeGaussianBlur stdDeviation='100' in='SourceGraphic'/%3e%3c/filter%3e%3c/defs%3e%3cg filter='url(%23blur-effect)'%3e%3cg transform-origin='center center'%3e%3canimateTransform attributeName='transform' type='rotate' from='0' to='360' dur='177s' repeatCount='indefinite'/%3e%3cellipse cx='226' cy='595' rx='211' ry='312' fill='%23483D8B' opacity='0.9'%3e%3canimate attributeName='cx' values='226;13;199;226' dur='26s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='595;723;598;595' dur='37s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='211;258.9;211;' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='312;203.3;312;' dur='24s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='373' cy='317' rx='159' ry='194' fill='%236A5ACD' opacity='0.9'%3e%3canimate attributeName='cx' values='373;182;218;373' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='317;363;187;317' dur='25s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='159;221.0;159;' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='194;184.2;194;' dur='34s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='668' cy='247' rx='312' ry='153' fill='%236A5ACD' opacity='0.9'%3e%3canimate attributeName='cx' values='668;434;748;668' dur='24s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='247;442;463;247' dur='36s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='312;273.8;312;' dur='30s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='153;123.6;153;' dur='19s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='492' cy='282' rx='276' ry='184' fill='%23483D8B' opacity='0.9'%3e%3canimate attributeName='cx' values='492;352;266;492' dur='38s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='282;479;228;282' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='276;276.8;276;' dur='22s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='184;134.4;184;' dur='25s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='614' cy='655' rx='204' ry='258' fill='%237B68EE' opacity='0.9'%3e%3canimate attributeName='cx' values='614;427;726;614' dur='33s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='655;773;854;655' dur='35s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='204;135.1;204;' dur='31s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='258;357.5;258;' dur='22s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3c/g%3e%3c/g%3e%3c/svg%3e",
    // Green
    "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3e%3cdefs%3e%3cfilter id='blur-effect' x='-100%25' y='-100%25' width='300%25' height='300%25'%3e%3cfeGaussianBlur stdDeviation='100' in='SourceGraphic'/%3e%3c/filter%3e%3c/defs%3e%3cg filter='url(%23blur-effect)'%3e%3cg transform-origin='center center'%3e%3canimateTransform attributeName='transform' type='rotate' from='0' to='360' dur='177s' repeatCount='indefinite'/%3e%3cellipse cx='226' cy='595' rx='211' ry='312' fill='%2390EE90' opacity='0.9'%3e%3canimate attributeName='cx' values='226;13;199;226' dur='26s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='595;723;598;595' dur='37s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='211;258.9;211;' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='312;203.3;312;' dur='24s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='373' cy='317' rx='159' ry='194' fill='%233CB371' opacity='0.9'%3e%3canimate attributeName='cx' values='373;182;218;373' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='317;363;187;317' dur='25s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='159;221.0;159;' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='194;184.2;194;' dur='34s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='668' cy='247' rx='312' ry='153' fill='%233CB371' opacity='0.9'%3e%3canimate attributeName='cx' values='668;434;748;668' dur='24s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='247;442;463;247' dur='36s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='312;273.8;312;' dur='30s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='153;123.6;153;' dur='19s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='492' cy='282' rx='276' ry='184' fill='%2390EE90' opacity='0.9'%3e%3canimate attributeName='cx' values='492;352;266;492' dur='38s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='282;479;228;282' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='276;276.8;276;' dur='22s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='184;134.4;184;' dur='25s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='614' cy='655' rx='204' ry='258' fill='%232E8B57' opacity='0.9'%3e%3canimate attributeName='cx' values='614;427;726;614' dur='33s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='655;773;854;655' dur='35s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='204;135.1;204;' dur='31s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='258;357.5;258;' dur='22s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3c/g%3e%3c/g%3e%3c/svg%3e",
    // Yellow
    "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3e%3cdefs%3e%3cfilter id='blur-effect' x='-100%25' y='-100%25' width='300%25' height='300%25'%3e%3cfeGaussianBlur stdDeviation='100' in='SourceGraphic'/%3e%3c/filter%3e%3c/defs%3e%3cg filter='url(%23blur-effect)'%3e%3cg transform-origin='center center'%3e%3canimateTransform attributeName='transform' type='rotate' from='0' to='360' dur='177s' repeatCount='indefinite'/%3e%3cellipse cx='226' cy='595' rx='211' ry='312' fill='%23FFFFE0' opacity='0.9'%3e%3canimate attributeName='cx' values='226;13;199;226' dur='26s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='595;723;598;595' dur='37s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='211;258.9;211;' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='312;203.3;312;' dur='24s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='373' cy='317' rx='159' ry='194' fill='%23FFD700' opacity='0.9'%3e%3canimate attributeName='cx' values='373;182;218;373' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='317;363;187;317' dur='25s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='159;221.0;159;' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='194;184.2;194;' dur='34s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='668' cy='247' rx='312' ry='153' fill='%23FFD700' opacity='0.9'%3e%3canimate attributeName='cx' values='668;434;748;668' dur='24s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='247;442;463;247' dur='36s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='312;273.8;312;' dur='30s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='153;123.6;153;' dur='19s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='492' cy='282' rx='276' ry='184' fill='%23FFFFE0' opacity='0.9'%3e%3canimate attributeName='cx' values='492;352;266;492' dur='38s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='282;479;228;282' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='276;276.8;276;' dur='22s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='184;134.4;184;' dur='25s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='614' cy='655' rx='204' ry='258' fill='%23F0E68C' opacity='0.9'%3e%3canimate attributeName='cx' values='614;427;726;614' dur='33s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='655;773;854;655' dur='35s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='204;135.1;204;' dur='31s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='258;357.5;258;' dur='22s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3c/g%3e%3c/g%3e%3c/svg%3e",
    // White
    "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3e%3cdefs%3e%3cfilter id='blur-effect' x='-100%25' y='-100%25' width='300%25' height='300%25'%3e%3cfeGaussianBlur stdDeviation='100' in='SourceGraphic'/%3e%3c/filter%3e%3c/defs%3e%3cg filter='url(%23blur-effect)'%3e%3cg transform-origin='center center'%3e%3canimateTransform attributeName='transform' type='rotate' from='0' to='360' dur='177s' repeatCount='indefinite'/%3e%3cellipse cx='226' cy='595' rx='211' ry='312' fill='%23F5F5F5' opacity='0.9'%3e%3canimate attributeName='cx' values='226;13;199;226' dur='26s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='595;723;598;595' dur='37s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='211;258.9;211;' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='312;203.3;312;' dur='24s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='373' cy='317' rx='159' ry='194' fill='%23FFFFFF' opacity='0.9'%3e%3canimate attributeName='cx' values='373;182;218;373' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='317;363;187;317' dur='25s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='159;221.0;159;' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='194;184.2;194;' dur='34s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='668' cy='247' rx='312' ry='153' fill='%23FFFFFF' opacity='0.9'%3e%3canimate attributeName='cx' values='668;434;748;668' dur='24s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='247;442;463;247' dur='36s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='312;273.8;312;' dur='30s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='153;123.6;153;' dur='19s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='492' cy='282' rx='276' ry='184' fill='%23F5F5F5' opacity='0.9'%3e%3canimate attributeName='cx' values='492;352;266;492' dur='38s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='282;479;228;282' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='276;276.8;276;' dur='22s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='184;134.4;184;' dur='25s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='614' cy='655' rx='204' ry='258' fill='%23E6E6FA' opacity='0.9'%3e%3canimate attributeName='cx' values='614;427;726;614' dur='33s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='655;773;854;655' dur='35s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='204;135.1;204;' dur='31s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='258;357.5;258;' dur='22s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3c/g%3e%3c/g%3e%3c/svg%3e",
    // Red
    "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3e%3cdefs%3e%3cfilter id='blur-effect' x='-100%25' y='-100%25' width='300%25' height='300%25'%3e%3cfeGaussianBlur stdDeviation='100' in='SourceGraphic'/%3e%3c/filter%3e%3c/defs%3e%3cg filter='url(%23blur-effect)'%3e%3cg transform-origin='center center'%3e%3canimateTransform attributeName='transform' type='rotate' from='0' to='360' dur='177s' repeatCount='indefinite'/%3e%3cellipse cx='226' cy='595' rx='211' ry='312' fill='%23F08080' opacity='0.9'%3e%3canimate attributeName='cx' values='226;13;199;226' dur='26s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='595;723;598;595' dur='37s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='211;258.9;211;' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='312;203.3;312;' dur='24s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='373' cy='317' rx='159' ry='194' fill='%23CD5C5C' opacity='0.9'%3e%3canimate attributeName='cx' values='373;182;218;373' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='317;363;187;317' dur='25s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='159;221.0;159;' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='194;184.2;194;' dur='34s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='668' cy='247' rx='312' ry='153' fill='%23CD5C5C' opacity='0.9'%3e%3canimate attributeName='cx' values='668;434;748;668' dur='24s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='247;442;463;247' dur='36s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='312;273.8;312;' dur='30s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='153;123.6;153;' dur='19s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='492' cy='282' rx='276' ry='184' fill='%23F08080' opacity='0.9'%3e%3canimate attributeName='cx' values='492;352;266;492' dur='38s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='282;479;228;282' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='276;276.8;276;' dur='22s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='184;134.4;184;' dur='25s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='614' cy='655' rx='204' ry='258' fill='%23E9967A' opacity='0.9'%3e%3canimate attributeName='cx' values='614;427;726;614' dur='33s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='655;773;854;655' dur='35s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='204;135.1;204;' dur='31s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='258;357.5;258;' dur='22s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3c/g%3e%3c/g%3e%3c/svg%3e",
    // Gold
    "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'%3e%3cdefs%3e%3cfilter id='blur-effect' x='-100%25' y='-100%25' width='300%25' height='300%25'%3e%3cfeGaussianBlur stdDeviation='100' in='SourceGraphic'/%3e%3c/filter%3e%3c/defs%3e%3cg filter='url(%23blur-effect)'%3e%3cg transform-origin='center center'%3e%3canimateTransform attributeName='transform' type='rotate' from='0' to='360' dur='177s' repeatCount='indefinite'/%3e%3cellipse cx='226' cy='595' rx='211' ry='312' fill='%23FFD700' opacity='0.9'%3e%3canimate attributeName='cx' values='226;13;199;226' dur='26s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='595;723;598;595' dur='37s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='211;258.9;211;' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='312;203.3;312;' dur='24s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='373' cy='317' rx='159' ry='194' fill='%23DAA520' opacity='0.9'%3e%3canimate attributeName='cx' values='373;182;218;373' dur='23s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='317;363;187;317' dur='25s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='159;221.0;159;' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='194;184.2;194;' dur='34s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='668' cy='247' rx='312' ry='153' fill='%23DAA520' opacity='0.9'%3e%3canimate attributeName='cx' values='668;434;748;668' dur='24s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='247;442;463;247' dur='36s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='312;273.8;312;' dur='30s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='153;123.6;153;' dur='19s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='492' cy='282' rx='276' ry='184' fill='%23FFD700' opacity='0.9'%3e%3canimate attributeName='cx' values='492;352;266;492' dur='38s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='282;479;228;282' dur='32s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='276;276.8;276;' dur='22s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='184;134.4;184;' dur='25s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3cellipse cx='614' cy='655' rx='204' ry='258' fill='%23B8860B' opacity='0.9'%3e%3canimate attributeName='cx' values='614;427;726;614' dur='33s' repeatCount='indefinite' /%3e%3canimate attributeName='cy' values='655;773;854;655' dur='35s' repeatCount='indefinite' /%3e%3canimate attributeName='rx' values='204;135.1;204;' dur='31s' repeatCount='indefinite' /%3e%3canimate attributeName='ry' values='258;357.5;258;' dur='22s' repeatCount='indefinite' /%3e%3c/ellipse%3e%3c/g%3e%3c/g%3e%3c/svg%3e"
];

// --- Sub-Components ---

interface SearchFormProps {
    isHeader: boolean;
    query: string;
    setQuery: (q: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

const SearchForm: React.FC<SearchFormProps> = ({ isHeader, query, setQuery, onSubmit, inputRef }) => (
    <form onSubmit={onSubmit} className={`relative ${isHeader ? 'flex-1' : 'w-full max-w-xl'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--token-on-surface-variant)]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
        <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث في MOHO..."
            className={`w-full bg-opacity-80 backdrop-blur-md outline-none transition-all duration-300 ${isHeader 
                ? 'pl-4 pr-10 py-2 bg-[var(--token-surface-container-highest)] border border-[var(--token-outline-variant)] rounded-full focus:ring-2 focus:ring-[var(--token-primary)]' 
                : 'pl-6 pr-12 py-4 text-lg bg-[var(--token-surface-container-highest)] border border-[var(--token-outline)] rounded-full focus:ring-2 focus:ring-[var(--token-primary)] shadow-lg'}`}
        />
    </form>
);

const AISummaryCard: React.FC<{ summary: string; onDismiss: () => void }> = ({ summary, onDismiss }) => (
    <div className="relative p-4 mb-6 bg-gradient-to-br from-[var(--token-primary-container)] to-blue-100 dark:from-[var(--token-primary-container)] dark:to-blue-900/40 rounded-2xl border border-blue-300/50 dark:border-blue-500/50 shadow-lg animate-fade-in">
        <button onClick={onDismiss} className="absolute top-2 left-2 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <XIcon className="w-4 h-4 text-[var(--token-on-primary-container)] opacity-70" />
        </button>
        <div className="flex items-start gap-3">
            <SparkleIcon className="w-6 h-6 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
                <h3 className="font-bold text-lg text-[var(--token-on-primary-container)]">ملخص بالذكاء الاصطناعي</h3>
                <p className="text-sm text-[var(--token-on-primary-container)]/80 mt-2 whitespace-pre-wrap">{summary}</p>
                <p className="text-xs text-[var(--token-on-primary-container)]/60 mt-3">تم إنشاؤه بواسطة الذكاء الاصطناعي بناءً على نتائج البحث وقد يحتوي على أخطاء.</p>
            </div>
        </div>
    </div>
);

const SkeletonResultItem: React.FC = () => (
    <div className="bg-[var(--token-surface-container-low)] p-4 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full loading-shimmer-bar"></div>
            <div className="h-4 w-1/3 rounded loading-shimmer-bar"></div>
        </div>
        <div className="h-6 w-3/4 rounded mb-3 loading-shimmer-bar"></div>
        <div className="space-y-2">
            <div className="h-4 w-full rounded loading-shimmer-bar"></div>
            <div className="h-4 w-5/6 rounded loading-shimmer-bar"></div>
        </div>
    </div>
);

const ImageLightbox: React.FC<{
    images: ImageResult[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (newIndex: number) => void;
}> = ({ images, currentIndex, onClose, onNavigate }) => {

    const handleNext = useCallback(() => {
        onNavigate((currentIndex + 1) % images.length);
    }, [currentIndex, images.length, onNavigate]);

    const handlePrev = useCallback(() => {
        onNavigate((currentIndex - 1 + images.length) % images.length);
    }, [currentIndex, images.length, onNavigate]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, handleNext, handlePrev]);

    const currentImage = images[currentIndex];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col p-4 animate-fade-in" onClick={onClose}>
            <header className="flex justify-end p-2 flex-shrink-0">
                 <button onClick={onClose} className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" aria-label="إغلاق"><XIcon className="w-6 h-6" /></button>
            </header>
            <main className="flex-1 flex items-center justify-center min-h-0 relative">
                 <button onClick={handlePrev} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" aria-label="السابق"><ChevronRightIcon className="w-7 h-7" /></button>
                 <img src={currentImage.link} alt={currentImage.title} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
                 <button onClick={handleNext} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors" aria-label="التالي"><ChevronLeftIcon className="w-7 h-7" /></button>
            </main>
            <footer className="p-4 text-center flex-shrink-0">
                <a href={currentImage.image.contextLink} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-white/90 text-black font-semibold rounded-full hover:bg-white transition-colors">
                    {currentImage.title}
                </a>
            </footer>
        </div>
    );
};

// --- Main Component ---
interface MohoSearchAppProps {
    onBack: () => void;
}

export const MohoSearchApp: React.FC<MohoSearchAppProps> = ({ onBack }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [imageResults, setImageResults] = useState<ImageResult[]>([]);
    const [searchInfo, setSearchInfo] = useState<SearchInformation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchType, setSearchType] = useState<'all' | 'image'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasSearched, setHasSearched] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setBgIndex(current => (current + 1) % BACKGROUNDS.length);
        }, 15000);
        return () => clearInterval(intervalId);
    }, []);

    const executeSearch = useCallback(async (searchQuery: string, page: number, type: 'all' | 'image') => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError(null);
        setAiSummary(null);
        setHasSearched(true);

        const start = (page - 1) * 10 + 1;
        const searchTypeParam = type === 'image' ? '&searchType=image' : '';
        const url = `${API_BASE_URL}?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&start=${start}${searchTypeParam}&hl=ar`;

        try {
            const response = await fetch(url);
            const data: ApiResponse = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error?.message || 'An unknown error occurred.');
            }
            
            if (type === 'image') {
                setImageResults((data.items as ImageResult[]) || []);
                setResults([]);
            } else {
                setResults((data.items as SearchResult[]) || []);
                setImageResults([]);
            }
            setSearchInfo(data.searchInformation || null);

        } catch (err: any) {
            console.error('Search API error:', err);
            setError(`فشل البحث: ${err.message}`);
            setResults([]);
            setImageResults([]);
            setSearchInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleGenerateSummary = useCallback(async () => {
        if (results.length === 0 || isSummaryLoading) return;
        setIsSummaryLoading(true);
        setAiSummary(null);
        setError(null);
        const snippets = results.map(r => `- ${r.snippet}`).join('\n');
        const prompt = `بناءً على مقتطفات نتائج البحث التالية حول استعلام "${query}"، قم بإنشاء ملخص شامل وموجز باللغة العربية. يجب أن يكون الملخص متماسكًا ويسلط الضوء على النقاط الرئيسية. لا تضف مقدمة أو خاتمة.

المقتطفات:
${snippets}

الملخص:`;
        try {
            const summary = await generateSimpleText(ModelId.ADAPTIVE, prompt, '');
            setAiSummary(summary);
        } catch (e: any) {
            setError("عذراً، لم نتمكن من إنشاء الملخص.");
            console.error(e);
        } finally {
            setIsSummaryLoading(false);
        }
    }, [results, query, isSummaryLoading]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        executeSearch(query, 1, searchType);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        executeSearch(query, page, searchType);
        window.scrollTo(0, 0);
    };
    
    const handleSearchTypeChange = (type: 'all' | 'image') => {
        if (type === searchType) return;
        setSearchType(type);
        setCurrentPage(1);
        if(hasSearched) {
          executeSearch(query, 1, type);
        }
    };
    
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    if (!hasSearched) {
        return (
            <div className="relative h-full w-full flex flex-col overflow-hidden">
                {BACKGROUNDS.map((bg, index) => (
                    <div 
                        key={index}
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out"
                        style={{ 
                            backgroundImage: `url("${bg}")`,
                            opacity: index === bgIndex ? 1 : 0
                        }}
                    />
                ))}
                <div className="relative z-10 h-full w-full flex flex-col">
                    <header className="p-2 flex-shrink-0">
                        <button onClick={onBack} className="p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors backdrop-blur-sm">
                            <ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" />
                        </button>
                    </header>
                    <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20 text-center">
                        <h1 className="text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-br from-blue-300 via-white to-blue-200" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                            MOHO
                        </h1>
                        <SearchForm isHeader={false} query={query} setQuery={setQuery} onSubmit={handleSearchSubmit} inputRef={inputRef} />
                    </main>
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full w-full flex flex-col bg-[var(--token-surface)]">
            {lightboxIndex !== null && (
                <ImageLightbox 
                    images={imageResults}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
            <header className="sticky top-0 p-2 flex items-center gap-2 border-b border-[var(--token-outline-variant)] flex-shrink-0 z-10 bg-[var(--token-surface)]/80 backdrop-blur-sm">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--token-surface-container-high)]"><ArrowLeftIcon className="w-5 h-5 transform scale-x-[-1]" /></button>
                <SearchForm isHeader={true} query={query} setQuery={setQuery} onSubmit={handleSearchSubmit} inputRef={inputRef} />
            </header>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-center my-4">
                        <div className="p-1 flex items-center gap-1 rounded-full bg-[var(--token-surface-container-high)]">
                            <button 
                                onClick={() => handleSearchTypeChange('all')} 
                                className={`flex items-center gap-2 py-2 px-5 text-sm font-semibold rounded-full transition-colors ${searchType === 'all' ? 'bg-[var(--token-secondary-container)] text-[var(--token-on-secondary-container)]' : 'text-[var(--token-on-surface-variant)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM4 9a2 2 0 100 4h12a2 2 0 100-4H4zM4 15a2 2 0 100 4h12a2 2 0 100-4H4z" /></svg>
                                <span>الكل</span>
                            </button>
                            <button 
                                onClick={() => handleSearchTypeChange('image')} 
                                className={`flex items-center gap-2 py-2 px-5 text-sm font-semibold rounded-full transition-colors ${searchType === 'image' ? 'bg-[var(--token-secondary-container)] text-[var(--token-on-secondary-container)]' : 'text-[var(--token-on-surface-variant)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <ImagePlaceholderIcon className="h-5 w-5" />
                                <span>صور</span>
                            </button>
                        </div>
                    </div>

                    {error && <div className="text-center py-16 text-red-500">{error}</div>}

                    {!isLoading && !error && searchType === 'all' && (
                         <div className="my-4 flex items-center justify-between">
                            {searchInfo?.formattedTotalResults && (
                                <p className="text-sm text-[var(--token-on-surface-variant)]">
                                    حوالي {searchInfo.formattedTotalResults} من النتائج ({searchInfo.formattedSearchTime} ثانية)
                                </p>
                            )}
                            {results.length > 0 && (
                                <button onClick={handleGenerateSummary} disabled={isSummaryLoading} className="flex items-center gap-2 text-sm font-semibold text-[var(--token-primary)] bg-blue-500/10 dark:bg-blue-400/10 px-3 py-1.5 rounded-full hover:bg-blue-500/20 dark:hover:bg-blue-400/20 disabled:opacity-50 disabled:cursor-wait">
                                    {isSummaryLoading ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <SparkleIcon className="w-4 h-4"/>}
                                    <span>{isSummaryLoading ? 'جارِ التلخيص...' : 'تلخيص بالذكاء الاصطناعي'}</span>
                                </button>
                            )}
                        </div>
                    )}
                    
                    {isSummaryLoading && <div className="p-4 mb-6 bg-[var(--token-primary-container)]/50 rounded-2xl flex items-center justify-center gap-3 text-sm text-[var(--token-on-primary-container)]"><LoaderIcon className="w-5 h-5 animate-spin"/><span>يقوم الذكاء الاصطناعي بتحليل النتائج...</span></div>}
                    {aiSummary && <AISummaryCard summary={aiSummary} onDismiss={() => setAiSummary(null)} />}

                    {isLoading && (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => <SkeletonResultItem key={i} />)}
                        </div>
                    )}

                    {!isLoading && !error && (
                        <>
                            {searchType === 'all' && results.length > 0 && (
                                <div className="space-y-4">
                                    {results.map((item, index) => <WebResultItem key={index} item={item} />)}
                                </div>
                            )}

                            {searchType === 'image' && imageResults.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {imageResults.map((item, index) => <ImageResultItem key={index} item={item} onClick={() => setLightboxIndex(index)} />)}
                                </div>
                            )}
                            
                            {(results.length === 0 && imageResults.length === 0) && (
                                <div className="text-center py-16">
                                    <p className="text-lg text-[var(--token-on-surface-variant)]">لم يتم العثور على نتائج لـ "{query}".</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {!isLoading && !error && (results.length > 0 || imageResults.length > 0) && (
                <footer className="sticky bottom-0 p-3 border-t border-[var(--token-outline-variant)] flex-shrink-0 bg-[var(--token-surface)]/80 backdrop-blur-md">
                    <div className="max-w-4xl mx-auto flex flex-col items-center">
                        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                            {currentPage > 1 && (
                                 <button onClick={() => handlePageChange(currentPage - 1)} className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium text-[var(--token-on-surface-variant)] hover:bg-[var(--token-surface-container-high)]">
                                    <ChevronRightIcon className="w-5 h-5"/>
                                </button>
                            )}
                            {Array.from({ length: Math.min(10, Math.ceil(parseInt(searchInfo?.totalResults || '0') / 10)) }).slice(Math.max(0, currentPage-3), currentPage+2).map((_, i) => {
                                const pageNum = i + Math.max(0, currentPage - 3) + 1;
                                return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${currentPage === pageNum ? 'bg-[var(--token-primary)] text-[var(--token-on-primary)] shadow-md' : 'text-[var(--token-on-surface-variant)] hover:bg-[var(--token-surface-container-high)]'}`}
                                >
                                    {pageNum}
                                </button>
                            )})}
                              <button onClick={() => handlePageChange(currentPage + 1)} className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium text-[var(--token-on-surface-variant)] hover:bg-[var(--token-surface-container-high)]">
                                <ChevronLeftIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};


const WebResultItem: React.FC<{ item: SearchResult }> = ({ item }) => {
    const [faviconError, setFaviconError] = useState(false);
    const domain = new URL(item.link).hostname;
    const faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

    return (
        <div className="bg-[var(--token-surface-container-low)] p-4 rounded-2xl hover:bg-[var(--token-surface-container-high)] transition-colors">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="group">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-[var(--token-surface-container-highest)] rounded-full">
                        {faviconError ? (
                            <GlobeIcon className="w-4 h-4 text-[var(--token-text-tertiary)]" />
                        ) : (
                            <img src={faviconUrl} alt="" className="w-4 h-4" onError={() => setFaviconError(true)} />
                        )}
                    </div>
                    <span className="text-sm text-[var(--token-on-surface-variant)] truncate">{item.displayLink}</span>
                </div>
                <h3 className="text-xl text-[var(--token-primary)] group-hover:underline font-medium">{item.title}</h3>
            </a>
            <p className="text-sm text-[var(--token-on-surface-variant)] mt-2" dangerouslySetInnerHTML={{ __html: item.snippet }}></p>
        </div>
    );
};

const ImageResultItem: React.FC<{ item: ImageResult; onClick: () => void }> = ({ item, onClick }) => {
    return (
        <button onClick={onClick} className="block relative aspect-square bg-[var(--token-surface-container-high)] rounded-2xl overflow-hidden group border border-[var(--token-outline-variant)]">
            <img src={item.image.thumbnailLink} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="absolute bottom-0 right-0 p-2 text-white text-xs leading-tight line-clamp-2">{item.title}</p>
            </div>
        </button>
    );
};