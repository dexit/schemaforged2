import React from 'react';
import { HistoryItem } from '../types';
import Modal from './ui/Modal';

interface HistoryModalProps {
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ history, onLoad, onDelete, onClose }) => {
  const footer = (
    <button
        onClick={onClose}
        className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-500 transition-colors"
    >
        Close
    </button>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Design History" footer={footer}>
        {history.length === 0 ? (
          <div className="text-center py-10 text-brand-text-secondary">
            <p>No saved designs found.</p>
            <p className="text-sm">Use the "Save Design" button to save your work.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {history.map(item => (
              <li key={item.id} className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between gap-4">
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-brand-text-primary truncate">{item.name}</p>
                  <p className="text-xs text-brand-text-secondary">
                    Saved on {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onLoad(item)}
                    className="text-sm bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-1 px-3 rounded-md transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-sm bg-red-600 hover:bg-red-500 text-white font-semibold py-1 px-3 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
    </Modal>
  );
};

export default HistoryModal;
