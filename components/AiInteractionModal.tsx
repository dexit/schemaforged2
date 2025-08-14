

import React, { useState, useEffect } from 'react';
import { Table } from '../types';
import Modal from './ui/Modal';

interface AiInteractionState {
  isOpen: boolean;
  mode: 'rebuild' | null;
  targetTable: Table | null;
  isLoading: boolean;
  error: string | null;
}

interface AiInteractionModalProps {
  state: AiInteractionState;
  onClose: () => void;
  onSubmit: (instruction: string) => void;
}

const AiInteractionModal: React.FC<AiInteractionModalProps> = ({
  state,
  onClose,
  onSubmit,
}) => {
  const { isOpen, mode, targetTable, isLoading, error } = state;
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInstruction(''); // Reset instruction on open
    }
  }, [isOpen]);

  if (!isOpen || mode !== 'rebuild' || !targetTable) return null;

  const title = `Rebuild '${targetTable?.name}' with AI`;

  const footerContent = (
    <>
      <button
        onClick={onClose}
        className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-500 transition-colors mr-2"
      >
        Cancel
      </button>
      <button
        onClick={() => onSubmit(instruction)}
        disabled={isLoading || !instruction}
        className="w-[140px] flex justify-center items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-primary-hover disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Submitting...' : 'Submit to AI'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footerContent}>
       <div>
            <label htmlFor="instruction" className="block text-sm font-medium text-brand-text-secondary mb-1">
            Describe the changes you want to make:
            </label>
            <textarea
            id="instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Add a 'last_login' timestamp column. Make the 'email' column unique."
            className="w-full h-32 p-2 bg-gray-800 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
            rows={4}
            />
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>
    </Modal>
  );
};

export default AiInteractionModal;