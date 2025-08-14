import React from 'react';

interface HistoryControlsProps {
    onNew: () => void;
    onSave: () => void;
    onHistory: () => void;
}

const HistoryControls: React.FC<HistoryControlsProps> = ({ onNew, onSave, onHistory }) => {
    return (
        <div className="grid grid-cols-3 gap-2">
            <button onClick={onNew} className="text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-2 rounded-md transition-colors">
                New Design
            </button>
            <button onClick={onSave} className="text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-2 rounded-md transition-colors">
                Save Design
            </button>
            <button onClick={onHistory} className="text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-2 rounded-md transition-colors">
                Manage History
            </button>
        </div>
    );
};

export default HistoryControls;
