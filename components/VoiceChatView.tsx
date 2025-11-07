import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenaiBlob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audio';
import { MicClassicIcon, MicClassicOffIcon, XIcon, PauseIcon, PlayIcon, VideoIcon, LoaderIcon } from './Icons';
import { MODELS } from '../constants';
import { ModelId } from '../types';

type SessionStatus = 'idle' | 'connecting' | 'active' | 'error';

const getAiInstance = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const TTS_VOICES = [
    { id: 'Zephyr', name: 'ذكر 1' },
    { id: 'Puck', name: 'ذكر 2' },
    { id: 'Charon', name: 'ذكر 3' },
    { id: 'Kore', name: 'أنثى 1' },
    { id: 'Fenrir', name: 'أنثى 2' },
];

// --- Three.js Animated Background Component ---
const AnimatedFogBackground: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const isDarkMode = document.documentElement.classList.contains('dark');

    useEffect(() => {
        if (!mountRef.current) return;

        let scene: THREE.Scene, camera: THREE.OrthographicCamera, renderer: THREE.WebGLRenderer, material: THREE.ShaderMaterial, mesh: THREE.Mesh;
        const container = mountRef.current;

        const colors = {
            dark: { color1: new THREE.Color(0x3B82F6), color2: new THREE.Color(0x4F46E5) },
            light: { color1: new THREE.Color(0x60A5FA), color2: new THREE.Color(0xA78BFA) }
        };

        const vertexShader = `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `;
        const fragmentShader = `
            uniform float u_time;
            uniform vec3 u_color1;
            uniform vec3 u_color2;
            varying vec2 vUv;
            void main() {
                vec2 st = vUv;
                st.y *= 1.5;
                float time = u_time * 0.4;
                vec2 pos1 = vec2(sin(time * 0.8) * 0.4 + 0.2, cos(time * 0.5) * 0.2 + 0.2);
                float d1 = 0.15 / distance(st, pos1);
                vec2 pos2 = vec2(sin(time * 1.0 + 2.0) * 0.3 + 0.8, cos(time * 0.7) * 0.2 + 0.3);
                float d2 = 0.2 / distance(st, pos2);
                vec2 pos3 = vec2(sin(time * 0.7 + 4.0) * 0.4 + 0.5, cos(time * 0.9) * 0.3 + 0.1);
                float d3 = 0.18 / distance(st, pos3);
                float sum = d1 + d2 + d3;
                vec3 color = mix(u_color2, u_color1, d1 / sum);
                color = mix(color, u_color2, d2 / sum);
                float intensity = smoothstep(0.8, 1.2, sum);
                float alpha = 1.0 - smoothstep(0.1, 0.9, vUv.y);
                gl_FragColor = vec4(color, alpha * intensity);
            }
        `;
        
        const init = () => {
            scene = new THREE.Scene();
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
            camera.position.z = 1;
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            container.appendChild(renderer.domElement);
            
            const geometry = new THREE.PlaneGeometry(2, 2);
            material = new THREE.ShaderMaterial({
                uniforms: {
                    u_time: { value: 0.0 },
                    u_color1: { value: colors[isDarkMode ? 'dark' : 'light'].color1 },
                    u_color2: { value: colors[isDarkMode ? 'dark' : 'light'].color2 }
                },
                vertexShader, fragmentShader, transparent: true
            });
            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
        };
        
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            material.uniforms.u_time.value += 0.01;
            renderer.render(scene, camera);
        };
        
        const onWindowResize = () => {
            renderer.setSize(container.clientWidth, container.clientHeight);
        };

        init();
        animate();
        window.addEventListener('resize', onWindowResize);

        return () => {
            window.removeEventListener('resize', onWindowResize);
            cancelAnimationFrame(animationFrameId);
            container.removeChild(renderer.domElement);
        };
    }, [isDarkMode]);

    return <div ref={mountRef} className="absolute bottom-0 left-0 right-0 h-1/2 w-full z-10 pointer-events-none" />;
};


// --- Main View Component ---
interface VoiceChatViewProps {
    onExit: () => void;
}

export const VoiceChatView: React.FC<VoiceChatViewProps> = ({ onExit }) => {
    const [status, setStatus] = useState<SessionStatus>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [selectedVoice, setSelectedVoice] = useState('Zephyr');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const isMutedRef = useRef(isMuted);
    
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const outputGainNodeRef = useRef<GainNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const playingSourcesRef = useRef(new Set<AudioBufferSourceNode>());

    useEffect(() => { isMutedRef.current = isMuted }, [isMuted]);

    useEffect(() => {
        let localStream: MediaStream | null = null;
        let localInputCtx: AudioContext | null = null;
        let localScriptProcessor: ScriptProcessorNode | null = null;
        let localSessionPromise: Promise<any> | null = null;

        const start = async () => {
            setStatus('connecting');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStream = stream;
                
                const ai = getAiInstance();
                
                localSessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            setStatus('active');
                            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                            localInputCtx = inputAudioContext;
                            const source = inputAudioContext.createMediaStreamSource(stream);
                            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                            localScriptProcessor = scriptProcessor;
                            
                            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                                if (isMutedRef.current) return;
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const pcmBlob: GenaiBlob = {
                                    data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                    mimeType: 'audio/pcm;rate=16000',
                                };
                                localSessionPromise?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(inputAudioContext.destination);
                        },
                        onmessage: async (message: LiveServerMessage) => {
                            if (message.serverContent?.interrupted) {
                                playingSourcesRef.current.forEach(source => source.stop());
                                playingSourcesRef.current.clear();
                                nextStartTimeRef.current = 0;
                            }
                            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio) {
                                if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
                                    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                                    outputGainNodeRef.current = outputAudioContextRef.current.createGain();
                                    outputGainNodeRef.current.connect(outputAudioContextRef.current.destination);
                                }
                                const outputCtx = outputAudioContextRef.current;
                                const outputNode = outputGainNodeRef.current!;
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                                const source = outputCtx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputNode);
                                source.addEventListener('ended', () => playingSourcesRef.current.delete(source));
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                playingSourcesRef.current.add(source);
                            }
                        },
                        onerror: (e: ErrorEvent) => { console.error('Session error:', e); setStatus('error'); },
                        onclose: () => { if (status !== 'connecting') setStatus('idle'); },
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
                        systemInstruction: MODELS[ModelId.VOICE].systemInstruction,
                    },
                });
                sessionPromiseRef.current = localSessionPromise;

            } catch (err) {
                console.error('Failed to start session:', err); setStatus('error');
            }
        };

        start();

        return () => {
            localSessionPromise?.then(session => session.close()).catch(console.error);
            localScriptProcessor?.disconnect();
            localInputCtx?.close().catch(console.error);
            localStream?.getTracks().forEach(track => track.stop());
            playingSourcesRef.current.forEach(source => source.stop());
            playingSourcesRef.current.clear();
            outputAudioContextRef.current?.close().catch(console.error);
            outputAudioContextRef.current = null;
        };
    }, [selectedVoice]);

    useEffect(() => {
        let timer: number;
        if (status === 'active') {
            timer = window.setInterval(() => setElapsedTime(t => t + 1), 1000);
        } else {
            setElapsedTime(0);
        }
        return () => window.clearInterval(timer);
    }, [status]);
    
    useEffect(() => {
        if (outputGainNodeRef.current && outputAudioContextRef.current) {
            const gain = isPaused ? 0 : 1;
            outputGainNodeRef.current.gain.setValueAtTime(gain, outputAudioContextRef.current.currentTime);
        }
    }, [isPaused]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="relative flex flex-col h-full w-full bg-black text-white">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30">
                 <div className="flex items-center gap-1 text-sm bg-black/20 px-2 py-1 rounded-full">
                    <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500' : (status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500')}`}></span>
                    <span>{status === 'active' ? 'مباشر' : (status === 'connecting' ? 'جارِ الاتصال...' : 'انقطع الاتصال')}</span>
                </div>
                {status === 'active' && <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>}
            </header>
            
            <main className="flex-grow"></main>
            
            <AnimatedFogBackground />
            
            <footer className="absolute bottom-0 left-0 right-0 z-20 p-4">
                 <div className="flex items-center justify-center gap-2 mb-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {TTS_VOICES.map(voice => (
                        <button
                            key={voice.id}
                            onClick={() => setSelectedVoice(voice.id)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full border transition-colors flex-shrink-0 ${
                                selectedVoice === voice.id
                                    ? 'bg-white/20 border-white/50 text-white'
                                    : 'border-white/30 text-white/70 hover:bg-white/10'
                            }`}
                        >
                            {voice.name}
                        </button>
                    ))}
                </div>

                <div className="flex justify-around items-center bg-gray-900/30 dark:bg-black/50 backdrop-blur-lg rounded-full p-3">
                    <button onClick={onExit} className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-all">
                        <XIcon className="h-6 w-6" />
                    </button>
                    <button onClick={() => setIsPaused(p => !p)} className="bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-all">
                        {isPaused ? <PlayIcon className="h-6 w-6" /> : <PauseIcon className="h-6 w-6" />}
                    </button>
                    <button onClick={() => setIsCameraOn(p => !p)} className={`p-4 rounded-full transition-all ${isCameraOn ? 'bg-blue-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                        <VideoIcon className="h-6 w-6" />
                    </button>
                    <button onClick={() => setIsMuted(p => !p)} className="bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-all">
                        {isMuted ? <MicClassicOffIcon className="h-6 w-6" /> : <MicClassicIcon className="h-6 w-6" />}
                    </button>
                </div>
            </footer>
        </div>
    );
};