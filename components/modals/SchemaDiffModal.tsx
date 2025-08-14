import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import { ProposedEnhancement, Schema } from '../../types';
import { diffSchemas, DiffResult, TableDiff, ColumnDiff, ValueChange } from '../../utils/schemaDiff';
import TasklistDisplay from '../ui/TasklistDisplay';


const ChangePill: React.FC<{ type: 'added' | 'deleted' | 'modified'; text?: string }> = ({ type, text }) => {
    const styles = {
        added: 'bg-green-500/20 text-green-300',
        deleted: 'bg-red-500/20 text-red-300',
        modified: 'bg-yellow-500/20 text-yellow-300',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[type]}`}>{text || type}</span>;
};

const ValueChangeDisplay: React.FC<{ change: ValueChange<any> }> = ({ change }) => (
    <>
        <span className="line-through text-red-400">{String(change.oldValue)}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 inline-block mx-1"><path fillRule="evenodd" d="M8.586 4.414a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L12.232 9.5H3.75a.75.75 0 0 1 0-1.5h8.482L8.586 5.474a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
        <span className="text-green-400">{String(change.newValue)}</span>
    </>
);

const ColumnDiffDisplay: React.FC<{ diff: ColumnDiff }> = ({ diff }) => (
    <div className={`ml-8 my-1 p-2 rounded-md text-sm ${
        diff.status === 'added' ? 'bg-green-500/10' :
        diff.status === 'deleted' ? 'bg-red-500/10' : 'bg-yellow-500/10'
    }`}>
        <div className="flex items-center gap-2">
            <ChangePill type={diff.status} text={diff.status === 'added' ? '+ Column' : diff.status === 'deleted' ? '- Column' : 'Modified'} />
            <span className={`font-mono ${diff.status === 'deleted' ? 'line-through' : ''}`}>{diff.name}</span>
            {diff.status === 'added' && <span className="font-mono text-green-300">({diff.newType})</span>}
            {diff.status === 'deleted' && <span className="font-mono text-gray-400 line-through">({diff.oldType})</span>}
        </div>
        {diff.status === 'modified' && (
            <div className="pl-8 mt-1 space-y-1 text-xs">
                {Object.entries(diff.changes).map(([key, value]) => (
                    <div key={key}>
                        <span className="text-gray-400">{key}: </span><ValueChangeDisplay change={value} />
                    </div>
                ))}
            </div>
        )}
    </div>
);

const TableDiffDisplay: React.FC<{ diff: TableDiff }> = ({ diff }) => (
    <div className="mb-4">
        <div className="flex items-center gap-3 p-2 bg-brand-surface rounded-md">
            <ChangePill type={diff.status} />
            <h3 className="text-lg font-bold">{diff.name}</h3>
        </div>
        <div className="mt-2 space-y-1">
            {diff.columns.added.map(c => <ColumnDiffDisplay key={c.name} diff={{...c, status: 'added'}} />)}
            {diff.columns.deleted.map(c => <ColumnDiffDisplay key={c.name} diff={{...c, status: 'deleted'}} />)}
            {diff.columns.modified.map(c => <ColumnDiffDisplay key={c.name} diff={{...c, status: 'modified'}} />)}
        </div>
    </div>
);

const VisualDiffViewer: React.FC<{diff: DiffResult}> = ({ diff }) => {
    const hasChanges = diff.tables.added.length > 0 || diff.tables.deleted.length > 0 || diff.tables.modified.length > 0;
    
    if (!hasChanges) {
        return (
            <div className="text-center py-10 text-brand-text-secondary">
                <p>The AI did not suggest any changes to the schema.</p>
            </div>
        );
    }
    
    return (
        <div className="max-h-[60vh] overflow-y-auto pr-2 font-sans">
            {diff.tables.added.map(t => <TableDiffDisplay key={t.name} diff={{...t, status: 'added'}} />)}
            {diff.tables.deleted.map(t => <TableDiffDisplay key={t.name} diff={{...t, status: 'deleted'}} />)}
            {diff.tables.modified.map(t => <TableDiffDisplay key={t.name} diff={{...t, status: 'modified'}} />)}
        </div>
    );
};


interface SchemaDiffModalProps {
    isOpen: boolean;
    originalSchema: Schema;
    enhancement: ProposedEnhancement;
    onClose: () => void;
    onAccept: () => void;
    isLoading: boolean;
}

const SchemaDiffModal: React.FC<SchemaDiffModalProps> = ({ isOpen, originalSchema, enhancement, onClose, onAccept, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'plan' | 'diff'>('plan');

    const diff = useMemo(() => {
        return diffSchemas(originalSchema, enhancement.proposedSchema);
    }, [originalSchema, enhancement.proposedSchema]);

    const footer = (
        <>
            <button onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-500 transition-colors mr-2">Reject</button>
            <button onClick={onAccept} disabled={isLoading} className="flex justify-center items-center w-36 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-500 disabled:bg-gray-500">
                {isLoading ? 'Applying...' : 'Accept Changes'}
            </button>
        </>
    );

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Review AI Schema Enhancement" footer={footer}>
            <div className="flex border-b border-brand-border mb-4">
                <TabButton name="Action Plan" isActive={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
                <TabButton name="Visual Diff" isActive={activeTab === 'diff'} onClick={() => setActiveTab('diff')} />
            </div>
            {activeTab === 'plan' && <TasklistDisplay tasks={enhancement.enhancementTasks} />}
            {activeTab === 'diff' && <VisualDiffViewer diff={diff} />}
        </Modal>
    );
};

export default SchemaDiffModal;