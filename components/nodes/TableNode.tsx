
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Table, Column } from '../../types';
import EditableText from '../EditableText';

type UpdateAction = 
    | { type: 'update-table-name', payload: { oldName: string, newName: string } }
    | { type: 'add-column', payload: { tableName: string } }
    | { type: 'delete-column', payload: { tableName: string, columnName: string } };

interface TableNodeProps {
  data: {
    table: Table;
    onUpdate: (action: UpdateAction) => void;
    onEdit: (payload: { tableName: string; columnName: string; }) => void;
    isHovered?: boolean;
  };
}

const ColumnRow: React.FC<{ 
    column: Column; 
    tableName: string;
    onUpdate: (action: UpdateAction) => void;
    onEdit: (payload: { tableName: string; columnName: string; }) => void;
}> = ({ column, tableName, onUpdate, onEdit }) => {
    
    const handleDeleteColumn = () => {
        if (window.confirm(`Are you sure you want to delete the column "${column.name}"?`)) {
            onUpdate({ type: 'delete-column', payload: { tableName, columnName: column.name } });
        }
    };

    const handleId = `${tableName}__${column.name}`;

    return (
        <li className="flex items-center justify-between py-2 px-3 border-t border-brand-border/50 group relative">
            <Handle
              type="source"
              position={Position.Left}
              id={handleId}
              className="!bg-purple-500 !w-3 !h-3 !-left-4 !border-none"
              title={`Create relationship from ${tableName}.${column.name}`}
            />
            <div className="flex items-center gap-2 flex-grow min-w-0">
               {column.isPrimaryKey && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-yellow-400 shrink-0">
                    <title>Primary Key</title>
                    <path fillRule="evenodd" d="M8 2a.75.75 0 0 1 .694.453l1.973 4.512 4.723.387a.75.75 0 0 1 .423 1.28l-3.53 3.083.993 4.65a.75.75 0 0 1-1.12.814L8 14.283l-4.156 2.41a.75.75 0 0 1-1.12-.814l.993-4.65-3.53-3.082a.75.75 0 0 1 .423-1.28l4.723-.387L7.306 2.453A.75.75 0 0 1 8 2Z" clipRule="evenodd" />
                </svg>
              )}
              {column.isForeignKey && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-sky-400 shrink-0">
                  <title>{`Foreign Key: ${column.foreignKeyTable}.${column.foreignKeyColumn}`}</title>
                  <path fillRule="evenodd" d="M8.586 4.414a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L12.232 9.5H3.75a.75.75 0 0 1 0-1.5h8.482L8.586 5.474a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              )}
              {!column.isPrimaryKey && !column.isForeignKey && <div className="w-4 h-4 shrink-0"></div>}
              <span className="font-mono text-sm text-brand-text-primary truncate">{column.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-brand-text-secondary bg-gray-700 px-2 py-0.5 rounded-full">{column.type.toUpperCase()}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit({tableName, columnName: column.name})} title="Edit Column" className="p-0.5 rounded hover:bg-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-gray-300">
                            <path d="M11.354 1.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-9 9a.5.5 0 0 1-.354.146H2.5a.5.5 0 0 1-.5-.5V11.5a.5.5 0 0 1 .146-.354l9-9Z" />
                            <path d="M12.5 2.707 13.293 3.5 4.5 12.293V13h.707L12.5 4.207V3.5h-.793Z" />
                        </svg>
                    </button>
                    <button onClick={handleDeleteColumn} title="Delete Column" className="p-0.5 rounded hover:bg-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed" disabled={column.isPrimaryKey}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-red-400">
                          <path d="M2.5 4.25a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75Z" />
                          <path fillRule="evenodd" d="M4.25 6a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Zm2.5 0a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Zm3.5-.75a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5Z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M3.05 4.5a.75.75 0 0 0-.75.75v.5c0 .414.336.75.75.75h9.9c.414 0 .75-.336.75-.75v-.5a.75.75 0 0 0-.75-.75H3.05ZM4.5 3a.5.5 0 0 0-.5.5v.5h8v-.5a.5.5 0 0 0-.5-.5h-7Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
            <Handle
              type="target"
              position={Position.Right}
              id={handleId}
              className="!bg-purple-500 !w-3 !h-3 !-right-4 !border-none"
              title={`Create relationship to ${tableName}.${column.name}`}
            />
        </li>
    );
};

const TableNode: React.FC<TableNodeProps> = ({ data }) => {
    const { table, onUpdate, onEdit, isHovered } = data;

    const handleTableNameChange = (newName: string) => {
        onUpdate({ type: 'update-table-name', payload: { oldName: table.name, newName } });
    };

    const handleAddColumn = () => {
        onUpdate({ type: 'add-column', payload: { tableName: table.name } });
    }

    return (
        <div className={`bg-brand-surface rounded-lg border-2 h-fit shadow-lg w-80 nodrag transition-all duration-200 ${isHovered ? 'border-purple-500 shadow-purple-500/30' : 'border-brand-border'}`}>
            <Handle type="target" position={Position.Left} isConnectable={false} className="!bg-sky-500 !w-3 !h-3 !-left-4" />
            <div className="flex items-center gap-2 p-3 bg-gray-900/30 rounded-t-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-brand-text-secondary">
                  <path d="M3 4.25A2.25 2.25 0 0 1 5.25 2h9.5A2.25 2.25 0 0 1 17 4.25v11.5A2.25 2.25 0 0 1 14.75 18h-9.5A2.25 2.25 0 0 1 3 15.75V4.25ZM5.25 4a.25.25 0 0 0-.25.25v2.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25v-2.5a.25.25 0 0 0-.25-.25h-9.5Z" />
                </svg>
                <EditableText
                    value={table.name}
                    onChange={handleTableNameChange}
                    className="font-bold text-md text-brand-text-primary flex-grow"
                    inputClassName="bg-gray-700"
                />
            </div>
            <ul>
                {table.columns.map((column) => (
                    <ColumnRow key={`${table.name}-${column.name}`} column={column} tableName={table.name} onUpdate={onUpdate} onEdit={onEdit} />
                ))}
            </ul>
            <div className="p-1 border-t border-brand-border/50">
                <button onClick={handleAddColumn} className="w-full text-center text-xs text-brand-text-secondary hover:text-brand-text-primary py-1.5 rounded-md hover:bg-brand-primary/20 transition-colors">
                    + Add Column
                </button>
            </div>
            <Handle type="source" position={Position.Right} isConnectable={false} className="!bg-yellow-500 !w-3 !h-3 !-right-4" />
        </div>
    );
};

export default memo(TableNode);
