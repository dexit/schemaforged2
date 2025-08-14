import React from 'react';
import { Schema } from '../types';

interface StateDebuggerProps {
  schema: Schema | null;
}

const StateDebugger: React.FC<StateDebuggerProps> = ({ schema }) => {
  const formattedJson = schema ? JSON.stringify(schema, null, 2) : 'null';
  
  return (
    <div className="max-h-72 overflow-y-auto pr-2">
      <div className="p-2 bg-gray-900/70 border border-brand-border rounded-lg">
          <pre className="text-xs text-brand-text-secondary whitespace-pre-wrap font-mono">
            {formattedJson}
          </pre>
      </div>
    </div>
  );
};

export default StateDebugger;
