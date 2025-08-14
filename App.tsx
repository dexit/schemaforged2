
import React, { useState, useCallback } from 'react';
import { Node } from 'reactflow';

import ControlPanel from './components/ControlPanel';
import InteractiveCanvas from './components/InteractiveCanvas';
import SqlOutput from './components/SqlOutput';
import ContextMenu from './components/ContextMenu';
import AiInteractionModal from './components/AiInteractionModal';
import HistoryModal from './components/HistoryModal';
import HistoryControls from './components/HistoryControls';
import ColumnEditorModal from './components/modals/ColumnEditorModal';
import SchemaDiffModal from './components/modals/SchemaDiffModal';

import { useHistoryManager } from './hooks/useHistoryManager';
import { useSchemaManager } from './hooks/useSchemaManager';
import { useAiInteractions } from './hooks/useAiInteractions';
import { Schema, Table } from './types';

function App() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const {
    history,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    handleSaveToHistory,
    handleLoadFromHistory,
    handleDeleteFromHistory,
    handleNewDesign,
  } = useHistoryManager();

  const [schema, setSchema] = useState<Schema | null>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    contextMenu,
    editingColumn,
    setEditingColumn,
    handleNodeContextMenu,
    closeContextMenu,
    handleConnect,
    updateSchema,
    forceLayout,
    onEdgeMouseEnter,
    onEdgeMouseLeave
  } = useSchemaManager(schema, setSchema);
  
  const { 
    prompt, setPrompt, 
    dbType, setDbType, 
    aiInteractionState, setAiInteractionState,
    modelConfig, setModelConfig,
    isLoading, error, apiLogs,
    streamingPreview, isPreviewing,
    originalSchemaForDiff,
    proposedEnhancement,
    isDiffModalOpen, setIsDiffModalOpen,
    suggestedIndexes, areIndexesLoading,
    handleGenerate, handleRebuildSubmit, handleEnhanceRequest,
    acceptProposedSchema,
    rejectProposedSchema,
    generateSql
  } = useAiInteractions(schema, setSchema);

  // Load initial design from history manager
  React.useEffect(() => {
    const item = history[0];
    if (item) {
      handleLoadFromHistory(item, setPrompt, setDbType, setSchema);
    } else {
      setPrompt('A simple blog with users, posts, and comments. Users can have many posts, and posts can have many comments.');
      setDbType('postgresql');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sql = React.useMemo(() => {
    if (schema) {
      try {
        return generateSql(schema, dbType);
      } catch (e) {
        console.error("Failed to generate SQL:", e);
        return `-- Error generating SQL: ${e instanceof Error ? e.message : 'Unknown error'}`;
      }
    }
    return '';
  }, [schema, dbType, generateSql]);

  const handleExport = (type: 'json' | 'sql') => {
    const content = type === 'json' ? JSON.stringify(schema, null, 2) : sql;
    const mimeType = type === 'json' ? 'application/json' : 'application/sql';
    const filename = type === 'json' ? 'schema.json' : 'schema.sql';

    if (!content) return;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
    const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Basic validation
                if (json && Array.isArray(json.tables)) {
                    setSchema(json);
                } else {
                    alert('Invalid schema file format.');
                }
            } catch (err) {
                console.error("Failed to parse JSON schema:", err);
                alert('Failed to parse schema file. Please ensure it is valid JSON.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
  };

  const handleAddTable = useCallback(() => {
    updateSchema({ type: 'add-table' });
  }, [updateSchema]);

  const handleDeleteTable = useCallback((nodeId: string) => {
    if(!schema) return;
    const tableExists = schema.tables.some(t => t.name === nodeId);
    if(tableExists) {
        updateSchema({ type: 'delete-table', payload: { tableName: nodeId }});
    }
  }, [schema, updateSchema]);

  // Robust context menu handlers
  const onRebuildTable = useCallback((node: Node) => {
    const table = schema?.tables.find(t => t.name === node.id);
    if(table) {
      setAiInteractionState(prev => ({ ...prev, isOpen: true, mode: 'rebuild', targetTable: table }));
    }
  }, [schema, setAiInteractionState]);

  const onEnhanceTable = useCallback((node: Node) => {
    const table = schema?.tables.find(t => t.name === node.id);
    if(schema && table) {
      handleEnhanceRequest(dbType, modelConfig, table);
    }
  }, [schema, dbType, modelConfig, handleEnhanceRequest]);


  return (
    <div className="flex h-screen font-sans bg-brand-bg text-brand-text-primary overflow-hidden">
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button onClick={() => setIsPanelOpen(true)} className="p-2 bg-brand-surface rounded-md border border-brand-border">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      <ControlPanel
        prompt={prompt} setPrompt={setPrompt}
        dbType={dbType} setDbType={setDbType}
        onGenerate={() => handleGenerate(prompt, dbType, modelConfig)}
        isLoading={isLoading}
        apiLogs={apiLogs}
        modelConfig={modelConfig} setModelConfig={setModelConfig}
        schema={schema}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      >
        <HistoryControls
          onNew={() => handleNewDesign(setPrompt, setSchema, setAiInteractionState)}
          onSave={() => {
            if (!schema) return;
            const name = window.prompt('Enter a name for this design:', `Design ${new Date().toLocaleString()}`);
            if (name) handleSaveToHistory(name, prompt, dbType, schema);
          }}
          onHistory={() => setIsHistoryModalOpen(true)}
        />
      </ControlPanel>

      <main className={`flex-1 flex flex-col p-2 md:p-4 gap-4 min-w-0 transition-all duration-300 ${isPanelOpen ? 'md:ml-0' : 'md:ml-0'}`}>
        <div className="flex justify-between items-center flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold text-brand-text-primary tracking-tight">SchemaForger</h1>
            <div className="flex items-center gap-2">
                <button onClick={handleImportJson} className="flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-3 rounded-md transition-colors" title="Import schema from a JSON file">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 4.75A2.75 2.75 0 0 1 4.75 2h4.5a.75.75 0 0 1 0 1.5h-4.5a1.25 1.25 0 0 0-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V10.5a.75.75 0 0 1 1.5 0v5.25A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25V4.75Z" clipRule="evenodd" /><path fillRule="evenodd" d="M10.75 2a.75.75 0 0 1 .75.75V8.19l1.97-1.97a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L6.22 7.28a.75.75 0 1 1 1.06-1.06l1.97 1.97V2.75A.75.75 0 0 1 10.75 2Z" clipRule="evenodd" /></svg>
                  <span className="hidden sm:inline">Import JSON</span>
                </button>
                <button onClick={() => { if(schema) handleEnhanceRequest(dbType, modelConfig) }} disabled={!schema || isLoading} className="flex items-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-1 px-3 rounded-md transition-colors" title="Get AI analysis for the entire schema">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.001 7.8a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM1.026 10a8.974 8.974 0 0 1 17.948 0 8.974 8.974 0 0 1-17.948 0ZM10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z" /></svg>
                    <span className="hidden sm:inline">Enhance with AI</span>
                </button>
                 <button onClick={forceLayout} disabled={!schema || isLoading} className="flex items-center gap-2 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-1 px-3 rounded-md transition-colors" title="Automatically re-arrange tables">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5ZM2 13.25A2.25 2.25 0 0 1 4.25 11h2.5A2.25 2.25 0 0 1 9 13.25v2.5A2.25 2.25 0 0 1 6.75 18h-2.5A2.25 2.25 0 0 1 2 15.75v-2.5ZM11 4.25A2.25 2.25 0 0 1 13.25 2h2.5A2.25 2.25 0 0 1 18 4.25v2.5A2.25 2.25 0 0 1 15.75 9h-2.5A2.25 2.25 0 0 1 11 6.75v-2.5ZM13.25 11A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z" clipRule="evenodd" /></svg>
                    <span className="hidden sm:inline">Auto-Layout</span>
                </button>
                <button onClick={handleAddTable} disabled={isLoading} className="flex items-center gap-2 text-sm bg-brand-primary hover:bg-brand-primary-hover disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-1 px-3 rounded-md transition-colors" title="Add a new table to the schema">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                    <span className="hidden sm:inline">Add Table</span>
                </button>
            </div>
        </div>
        <InteractiveCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeContextMenu={handleNodeContextMenu}
            onPaneClick={closeContextMenu}
            onConnect={handleConnect}
            isLoading={isLoading && nodes.length === 0}
            error={error}
            onEdgeMouseEnter={onEdgeMouseEnter}
            onEdgeMouseLeave={onEdgeMouseLeave}
        />
      </main>

      <SqlOutput
        sql={sql}
        isLoading={isLoading && nodes.length === 0}
        onExportSql={() => handleExport('sql')}
        isPreviewing={isPreviewing}
        previewContent={streamingPreview}
        suggestedIndexes={suggestedIndexes}
        areIndexesLoading={areIndexesLoading}
      />

      {contextMenu && (
        <ContextMenu
          mouseX={contextMenu.mouseX} mouseY={contextMenu.mouseY}
          onClose={closeContextMenu}
          onDelete={() => handleDeleteTable(contextMenu.nodeId)}
          onRebuild={() => {
            const node = nodes.find(n => n.id === contextMenu.nodeId);
            if (node) onRebuildTable(node);
          }}
          onEnhance={() => {
            const node = nodes.find(n => n.id === contextMenu.nodeId);
            if (node) onEnhanceTable(node);
          }}
        />
      )}

      {aiInteractionState.isOpen && (
        <AiInteractionModal
          state={aiInteractionState}
          onClose={() => setAiInteractionState(prev => ({ ...prev, isOpen: false }))}
          onSubmit={(instruction: string) => {
            if (aiInteractionState.targetTable) {
                handleRebuildSubmit(instruction, aiInteractionState.targetTable, dbType, modelConfig)
            }
          }}
        />
      )}
      
      {isHistoryModalOpen && (
        <HistoryModal
          history={history}
          onLoad={(item) => handleLoadFromHistory(item, setPrompt, setDbType, setSchema)}
          onDelete={handleDeleteFromHistory}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}

      {editingColumn && schema && (
        <ColumnEditorModal
          isOpen={true}
          onClose={() => setEditingColumn(null)}
          column={schema.tables.find(t => t.name === editingColumn.tableName)?.columns.find(c => c.name === editingColumn.columnName)!}
          table={schema.tables.find(t => t.name === editingColumn.tableName)!}
          allTables={schema.tables}
          dbType={dbType}
          onSave={(newColumnData) => {
            updateSchema({ type: 'update-column', payload: { tableName: editingColumn.tableName, columnName: editingColumn.columnName, newColumn: newColumnData } });
            setEditingColumn(null);
          }}
        />
      )}

      {isDiffModalOpen && proposedEnhancement && originalSchemaForDiff && (
        <SchemaDiffModal
          isOpen={isDiffModalOpen}
          originalSchema={originalSchemaForDiff}
          enhancement={proposedEnhancement}
          onClose={rejectProposedSchema}
          onAccept={acceptProposedSchema}
          isLoading={isLoading}
        />
      )}

    </div>
  );
}

export default App;
