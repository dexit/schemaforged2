import React, { useState } from 'react';
import { DbType, ApiLog, ModelConfig, Schema } from '../types';
import Slider from './ui/Slider';
import StateDebugger from './StateDebugger';

interface ControlPanelProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  dbType: DbType;
  setDbType: (dbType: DbType) => void;
  onGenerate: () => void;
  isLoading: boolean;
  apiLogs: ApiLog[];
  modelConfig: ModelConfig;
  setModelConfig: (config: ModelConfig) => void;
  schema: Schema | null;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

const TabButton: React.FC<{ name: string; isActive: boolean; onClick: () => void }> = ({ name, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none ${
            isActive
                ? 'border-b-2 border-brand-primary text-brand-text-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary border-b-2 border-transparent'
        }`}
    >
        {name}
    </button>
);


const ControlPanel: React.FC<ControlPanelProps> = ({
  prompt,
  setPrompt,
  dbType,
  setDbType,
  onGenerate,
  isLoading,
  apiLogs,
  modelConfig,
  setModelConfig,
  schema,
  children,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'logs' | 'state'>('settings');

  const panelContent = (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-brand-primary">
              <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v1.286a.75.75 0 0 0 .75.75h.008a7.217 7.217 0 0 1 2.582 0 .75.75 0 0 0 .75-.75V5.25a.75.75 0 0 0-.5-.707ZM12.75 4.533A9.707 9.707 0 0 1 18 3a9.735 9.735 0 0 1 3.25.555.75.75 0 0 1 .5.707v1.286a.75.75 0 0 1-.75.75h-.008a7.217 7.217 0 0 0-2.582 0 .75.75 0 0 1-.75-.75V5.25a.75.75 0 0 1 .5-.707Z" />
              <path fillRule="evenodd" d="M12 21a9.75 9.75 0 0 0 7.163-3.428.75.75 0 0 0-.398-1.291 7.43 7.43 0 0 1-2.953-.434.75.75 0 0 0-.822.22l-1.037 1.038a.75.75 0 0 1-1.06 0l-1.037-1.038a.75.75 0 0 0-.823-.22 7.43 7.43 0 0 1-2.953.434.75.75 0 0 0-.398 1.291A9.75 9.75 0 0 0 12 21ZM12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clipRule="evenodd" />
            </svg>
            <h1 className="text-2xl font-bold tracking-tight">Gemini DB Designer</h1>
          </div>
          <button onClick={onClose} className="md:hidden p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-brand-text-secondary mb-6">
          Describe your database requirements in plain English, and let AI generate the schema and SQL for you.
        </p>
      </div>

      <div className="flex-grow flex flex-col gap-4 overflow-y-auto px-4 pb-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-1">Describe Schema</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., An e-commerce site with products, customers, and orders."
            className="w-full h-40 p-2 bg-gray-800 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
            rows={5}
          />
        </div>

        <div>
          <label htmlFor="dbType" className="block text-sm font-medium text-brand-text-secondary mb-1">Database Type</label>
          <select
            id="dbType"
            value={dbType}
            onChange={(e) => setDbType(e.target.value as DbType)}
            className="w-full p-2 bg-gray-800 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite (D1)</option>
          </select>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 10 3ZM10 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM5.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z" clipRule="evenodd" /></svg>
          )}
          {isLoading ? 'Generating...' : 'Generate Schema'}
        </button>
      </div>

      <div className="flex-shrink-0 pt-4 mt-4 border-t border-brand-border px-4">
          {children}
          <div className="mt-4">
            <div className="flex border-b border-brand-border">
                <TabButton name="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                <TabButton name="API Logs" isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                <TabButton name="State" isActive={activeTab === 'state'} onClick={() => setActiveTab('state')} />
            </div>

            <div className="py-4 overflow-y-auto max-h-[300px]">
                {activeTab === 'settings' && (
                    <div className="space-y-3 p-1">
                        <h3 className="text-md font-semibold text-brand-text-primary px-1">Advanced AI Settings</h3>
                        <Slider label="Temperature" value={modelConfig.temperature ?? 0.5} min={0} max={1} step={0.1} onChange={v => setModelConfig({...modelConfig, temperature: v})} />
                        <Slider label="Top-K" value={modelConfig.topK ?? 32} min={1} max={100} step={1} onChange={v => setModelConfig({...modelConfig, topK: v})} />
                        <Slider label="Top-P" value={modelConfig.topP ?? 1} min={0} max={1} step={0.05} onChange={v => setModelConfig({...modelConfig, topP: v})} />
                    </div>
                )}
                {activeTab === 'logs' && (
                    <div>
                        {apiLogs.length === 0 ? (
                        <p className="text-sm text-brand-text-secondary text-center py-4">No API calls made yet.</p>
                        ) : (
                        <ul className="space-y-4">
                            {apiLogs.map((log) => (
                            <li key={log.id} className="text-xs">
                                <p className="font-semibold text-brand-text-primary"><span className="text-green-400">POST</span> {log.request.model}</p>
                                <p className="text-brand-text-secondary">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                <details className="mt-2"><summary className="cursor-pointer text-sky-400">View Details</summary>
                                    <div className="mt-1 p-2 bg-black/30 rounded"><h4 className="font-bold text-brand-text-primary">Request Prompt:</h4><pre className="whitespace-pre-wrap font-mono text-brand-text-secondary bg-transparent border-none p-0">{log.request.prompt}</pre><h4 className="font-bold mt-2 text-brand-text-primary">Response:</h4><pre className="whitespace-pre-wrap font-mono text-brand-text-secondary bg-transparent border-none p-0">{log.error ? `Error: ${log.error}` : log.response}</pre></div>
                                </details>
                            </li>
                            ))}
                        </ul>
                        )}
                    </div>
                )}
                {activeTab === 'state' && <StateDebugger schema={schema} />}
            </div>
          </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block w-[450px] flex-shrink-0 bg-brand-surface border-r border-brand-border h-full">
        {panelContent}
      </div>
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
          <div className="absolute top-0 left-0 h-full w-[85%] max-w-[450px] bg-brand-surface border-r border-brand-border overflow-y-auto">
            {panelContent}
          </div>
        </div>
      )}
    </>
  );
};

export default ControlPanel;