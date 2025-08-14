
import React, { useState, useEffect, useRef } from 'react';
import hljs from 'highlight.js';

interface SqlOutputProps {
  sql: string;
  isLoading: boolean;
  onExportSql: () => void;
  isPreviewing: boolean;
  previewContent: string;
  suggestedIndexes: string;
  areIndexesLoading: boolean;
}

const SqlOutput: React.FC<SqlOutputProps> = ({ 
    sql, isLoading, onExportSql, isPreviewing, previewContent,
    suggestedIndexes, areIndexesLoading 
}) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const indexCodeRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (codeRef.current && sql) {
      hljs.highlightElement(codeRef.current);
    }
  }, [sql]);

  useEffect(() => {
    if (indexCodeRef.current && suggestedIndexes) {
      hljs.highlightElement(indexCodeRef.current);
    }
  }, [suggestedIndexes]);
  
  useEffect(() => {
    if (previewRef.current) {
        previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [previewContent]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    const contentToCopy = isPreviewing ? previewContent : `${sql}\n\n${suggestedIndexes}`;
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy.trim());
      setCopied(true);
    }
  };

  const title = isPreviewing ? "Live AI Response" : "Generated SQL";
  const effectiveContent = isPreviewing ? previewContent : sql;
  const isExportDisabled = isPreviewing || !sql || isLoading;

  return (
    <aside className="hidden md:flex flex-shrink-0 basis-[500px] bg-brand-surface flex-col p-4 border-l border-brand-border h-full">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!effectiveContent}
              className="flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-1 px-3 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-400"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v3.043m-7.332 0c-.055.194-.084.4-.084.612v3.043m0 0v1.518a2.25 2.25 0 0 0 2.25 2.25h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.518m-4.5 0h4.5" /></svg>
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onExportSql}
              disabled={isExportDisabled}
              className="flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-1 px-3 rounded-md transition-colors"
              title="Download SQL file"
            >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
              <span>Export</span>
            </button>
        </div>
      </div>
      <div className="flex-grow flex flex-col gap-4 min-h-0">
        <div className="flex-grow bg-gray-900/70 border border-brand-border rounded-lg p-1 relative min-h-0">
          <pre ref={previewRef} className="h-full w-full overflow-auto text-sm">
            {isPreviewing ? (
              <code className="p-4 block whitespace-pre-wrap font-mono text-gray-300">{previewContent}<span className="animate-pulse">_</span></code>
            ) : sql ? (
              <code ref={codeRef} className="language-sql p-4 block whitespace-pre-wrap">{sql}</code>
            ) : (
              <code className="language-sql p-4 block whitespace-pre-wrap text-gray-500">
                {isLoading && !sql && 'Generating SQL...'}
                {!isLoading && !sql && '-- SQL output will appear here'}
              </code>
            )}
          </pre>
          {isLoading && !isPreviewing && <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center"><svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
        </div>
        
        {(sql && !isPreviewing) && (
            <div className="flex-shrink-0">
                <h3 className="text-md font-bold mb-2 text-brand-text-secondary">AI-Suggested Indexes</h3>
                <div className="bg-gray-900/70 border border-brand-border rounded-lg p-1 relative max-h-48 overflow-y-auto">
                    <pre className="text-sm">
                        {areIndexesLoading ? (
                            <code className="p-4 block text-gray-500">Generating suggestions...</code>
                        ) : (
                            <code ref={indexCodeRef} className="language-sql p-4 block whitespace-pre-wrap">{suggestedIndexes || '-- No performance suggestions were found.'}</code>
                        )}
                    </pre>
                </div>
            </div>
        )}
      </div>
    </aside>
  );
};

export default SqlOutput;
