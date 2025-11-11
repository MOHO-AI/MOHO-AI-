import React, { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { RefreshIcon, MaximizeIcon, XIcon, DownloadIcon } from './Icons';

interface DesignPreviewProps {
  code: string;
  designName: string;
  isStreaming: boolean;
  onRunCode: () => void;
}

const FullScreenPreview: React.FC<{ code: string; onClose: () => void }> = ({ code, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col p-4 animate-fade-in" dir="ltr">
      <div className="flex justify-end mb-2">
        <button onClick={onClose} className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30" aria-label="إغلاق">
          <XIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 bg-white rounded-lg overflow-hidden">
        <iframe
          srcDoc={code}
          title="Fullscreen Design Preview"
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
          style={{backgroundColor: 'white'}}
        />
      </div>
    </div>
  );
};

export const DesignPreview: React.FC<DesignPreviewProps> = ({ code, designName, isStreaming, onRunCode }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const codeEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Automatically switch to code view when streaming starts
    if (isStreaming) {
      setActiveTab('code');
    }
  }, [isStreaming]);
  
  useEffect(() => {
    // Scroll to the end of the code when it's updated during streaming
    if (isStreaming && activeTab === 'code') {
      setTimeout(() => codeEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [code, isStreaming, activeTab]);

  const placeholder = `
    <body style="margin: 0; background-color: var(--token-surface-container); direction: rtl;">
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: 'Tajawal', sans-serif; color: var(--token-on-surface-variant); padding: 2rem; text-align: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--token-outline); margin-bottom: 1rem;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; color: var(--token-on-surface);">سيتم عرض المعاينة هنا</h3>
        <p style="margin: 0; font-size: 0.9rem;">اطلب من "موهو المعقد" تصميم واجهة وسيتم عرضها هنا مباشرة.</p>
      </div>
    </body>
  `;
  
  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${designName.replace(/ /g, '_') || 'design'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunAndPreview = () => {
    onRunCode();
    setActiveTab('preview');
  };

  return (
    <>
        <div className="bg-[var(--token-main-surface-primary)] rounded-2xl border border-[var(--token-border-default)] flex flex-col h-full overflow-hidden" style={{boxShadow: 'var(--elevation-1)'}}>
            <header className="p-2 pl-3 border-b border-[var(--token-border-default)] z-10 flex items-center justify-between">
                <div className="flex items-center gap-1">
                     <button
                        onClick={() => setIsFullScreen(true)}
                        className="p-2 rounded-full text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-secondary)] transition-colors"
                        aria-label="عرض ملء الشاشة"
                    >
                        <MaximizeIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!code}
                        className="p-2 rounded-full text-[var(--token-icon-secondary)] hover:bg-[var(--token-main-surface-secondary)] transition-colors disabled:opacity-50"
                        aria-label="تحميل الكود"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
                <h2 className="text-base font-semibold truncate px-2 text-[var(--token-on-surface)]" title={designName}>
                    {designName || 'تصميم جديد'}
                </h2>
                <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--token-main-surface-secondary)]">
                    <button onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 text-sm rounded-full transition-all ${activeTab === 'preview' ? 'bg-[var(--token-main-surface-primary)] shadow-sm text-[var(--token-text-primary)] font-medium' : 'text-[var(--token-text-secondary)]'}`}>معاينة</button>
                    <button onClick={() => setActiveTab('code')} className={`px-4 py-1.5 text-sm rounded-full transition-all ${activeTab === 'code' ? 'bg-[var(--token-main-surface-primary)] shadow-sm text-[var(--token-text-primary)] font-medium' : 'text-[var(--token-text-secondary)]'}`}>الكود</button>
                </div>
            </header>
            <div className="flex-1 min-h-0 relative">
                <div className={`w-full h-full ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
                    <iframe
                        key={Date.now()}
                        srcDoc={code || placeholder}
                        title="Design Preview"
                        sandbox="allow-scripts allow-same-origin"
                        className="w-full h-full border-0"
                        style={{backgroundColor: 'white'}}
                    />
                </div>
                <div className={`w-full h-full ${activeTab === 'code' ? 'block' : 'hidden'}`} dir="ltr">
                     {isStreaming && (
                        <div className="absolute top-3 right-3 z-10 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>يكتب...</span>
                        </div>
                    )}
                    <SyntaxHighlighter 
                        style={vscDarkPlus} 
                        language="html"
                        showLineNumbers 
                        wrapLines
                        lineNumberStyle={{ minWidth: '3.25em', color: '#858585', paddingRight: '1em', userSelect: 'none' }}
                        customStyle={{ padding: '1rem', margin: 0, backgroundColor: '#1e1e1e', fontSize: '0.875rem', lineHeight: '1.5' }}
                        codeTagProps={{ style: { fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace" } }}
                        className="w-full h-full overflow-auto"
                    >
                        {code || " "}
                    </SyntaxHighlighter>
                    <div ref={codeEndRef} />
                </div>
            </div>
            {activeTab === 'code' && (
                <div className="p-3 border-t border-[var(--token-border-default)]">
                    <button onClick={handleRunAndPreview} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--token-primary-container)] text-[var(--token-on-primary-container)] font-semibold hover:opacity-90 transition-opacity">
                        <RefreshIcon className="w-5 h-5"/>
                        <span>تشغيل وتحديث المعاينة</span>
                    </button>
                </div>
            )}
        </div>
        {isFullScreen && <FullScreenPreview code={code || placeholder} onClose={() => setIsFullScreen(false)} />}
    </>
  );
};
