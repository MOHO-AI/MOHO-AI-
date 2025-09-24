import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckIcon, CopyIcon, PlayIcon, XIcon, RefreshCwIcon } from './Icons';

interface CodeBlockProps {
    language: string | undefined;
    children: React.ReactNode;
    className?: string;
    inline?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<{ type: 'log' | 'error', message: string } | null>(null);
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    setOutput(null);
    // Capture console.log output
    const logMessages: any[] = [];
    const originalLog = console.log;
    console.log = (...args) => {
        logMessages.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
        originalLog.apply(console, args);
    };

    try {
        const result = new Function(codeString)();
        let resultMessage = logMessages.join('\n');
        if (result !== undefined) {
            resultMessage += (resultMessage ? '\n' : '') + `=> ${String(result)}`;
        }
        if (!resultMessage) {
            resultMessage = 'اكتمل التنفيذ بنجاح (بدون إخراج).';
        }
        setOutput({ type: 'log', message: resultMessage });
    } catch (e: any) {
        setOutput({ type: 'error', message: e.stack || e.message });
    } finally {
        // Restore original console.log
        console.log = originalLog;
    }
  };


  if (props.inline) {
    return (
        <code className="px-1 py-0.5 bg-[var(--token-main-surface-tertiary)] rounded-md font-mono text-sm" {...props} style={{color: 'var(--token-text-secondary)'}}>
          {children}
        </code>
      );
  }
  
  const isRunnable = language === 'javascript' || language === 'js';

  return (
    <div className="relative my-4 rounded-lg bg-[#2d2d2d] border border-gray-700">
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-700/50 rounded-t-lg">
        <span className="text-xs text-gray-400">{language || 'code'}</span>
        <div className="flex items-center gap-3">
            {isRunnable && (
                <button onClick={handleRun} className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors text-xs" title="تشغيل الكود">
                    <PlayIcon className="w-3.5 h-3.5" />
                    <span>تشغيل</span>
                </button>
            )}
            <button onClick={handleCopy} className="text-gray-300 hover:text-white transition-colors" title="نسخ الكود">
              {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            </button>
        </div>
      </div>
      <SyntaxHighlighter style={vscDarkPlus} language={language} PreTag="div" className="!p-4 !m-0 !bg-transparent text-sm overflow-x-auto" {...props}>
        {codeString}
      </SyntaxHighlighter>
      {output && (
        <div className={`px-4 py-2 border-t text-right ${output.type === 'error' ? 'border-red-500/30 bg-red-900/20 text-red-300' : 'border-green-500/30 bg-green-900/20 text-green-300'}`}>
            <div className="flex justify-between items-center mb-1">
                <button onClick={() => setOutput(null)} className="text-gray-400 hover:text-white"><XIcon className="w-4 h-4" /></button>
                <h4 className="text-xs font-bold uppercase">{output.type === 'error' ? 'خطأ' : 'النتيجة'}</h4>
            </div>
            <pre className="text-xs whitespace-pre-wrap font-mono">{output.message}</pre>
        </div>
      )}
    </div>
  );
};