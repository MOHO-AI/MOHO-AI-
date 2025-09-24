import React, { useState, useEffect } from 'react';
import { RefreshIcon } from './Icons';

interface DesignPreviewProps {
  code: string;
  setCode: (code: string) => void;
}

export const DesignPreview: React.FC<DesignPreviewProps> = ({ code, setCode }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setIframeKey(prev => prev + 1);
  }, [code]);

  const handleRunCode = () => {
    setIframeKey(prev => prev + 1);
    setActiveTab('preview');
  };

  const placeholder = `
    <body style="margin: 0; background-color: white; direction: rtl;">
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; font-family: 'IBM Plex Sans Arabic', sans-serif; color: #606060; padding: 2rem; text-align: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: #909090; margin-bottom: 1rem;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; color: #303030;">سيتم عرض المعاينة هنا</h3>
        <p style="margin: 0; font-size: 0.9rem;">سيتم عرض التصميم الذي تم إنشاؤه بواسطة النموذج في هذه النافذة.</p>
      </div>
    </body>
  `;

  return (
    <div className="bg-[var(--token-main-surface-secondary)] rounded-xl border border-[var(--token-border-default)] flex flex-col h-full overflow-hidden">
      <div className="p-2 border-b border-[var(--token-border-default)] z-10 bg-[var(--token-main-surface-secondary)]/70 backdrop-blur-sm flex items-center justify-center">
        <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--token-main-surface-tertiary)]">
          <button onClick={() => setActiveTab('preview')} className={`px-4 py-1 text-sm rounded-full transition-all ${activeTab === 'preview' ? 'bg-[var(--token-main-surface-primary)] shadow-sm text-[var(--token-text-primary)] font-semibold' : 'text-[var(--token-text-secondary)]'}`}>معاينة</button>
          <button onClick={() => setActiveTab('code')} className={`px-4 py-1 text-sm rounded-full transition-all ${activeTab === 'code' ? 'bg-[var(--token-main-surface-primary)] shadow-sm text-[var(--token-text-primary)] font-semibold' : 'text-[var(--token-text-secondary)]'}`}>الكود</button>
        </div>
      </div>
      {activeTab === 'preview' ? (
        <iframe
          key={iframeKey}
          srcDoc={code || placeholder}
          title="Design Preview"
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
          style={{backgroundColor: 'white'}}
        />
      ) : (
        <div className="flex flex-col h-full bg-[#2d2d2d]" dir="ltr">
            <div className="p-2 flex-shrink-0 border-b border-gray-700">
                <button onClick={handleRunCode} className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
                    <RefreshIcon className="w-5 h-5"/>
                    <span>تشغيل وتحديث المعاينة</span>
                </button>
            </div>
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full p-3 font-mono text-sm bg-transparent text-gray-200 border-0 focus:outline-none resize-none"
                spellCheck="false"
            />
        </div>
      )}
    </div>
  );
};