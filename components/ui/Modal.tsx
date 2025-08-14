import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-brand-surface rounded-lg shadow-2xl w-full max-w-2xl border border-brand-border flex flex-col max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-brand-border flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none">&times;</button>
                </header>
                <main className="p-6 flex-grow overflow-y-auto">
                    {children}
                </main>
                {footer && (
                    <footer className="p-4 border-t border-brand-border flex justify-end flex-shrink-0 bg-brand-surface rounded-b-lg">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default Modal;