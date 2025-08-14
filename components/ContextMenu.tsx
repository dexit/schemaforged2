import React from 'react';

interface ContextMenuProps {
  mouseX: number;
  mouseY: number;
  onClose: () => void;
  onDelete: () => void;
  onRebuild: () => void;
  onEnhance: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ mouseX, mouseY, onClose, onDelete, onRebuild, onEnhance }) => {
  const style = {
    top: mouseY,
    left: mouseX,
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        style={style}
        className="fixed z-50 w-56 bg-brand-surface rounded-md shadow-lg border border-brand-border text-sm text-brand-text-primary animate-fade-in-fast"
      >
        <ul className="py-1">
          <li>
            <button onClick={() => handleAction(onRebuild)} className="w-full flex items-center gap-3 text-left px-4 py-2 hover:bg-brand-primary/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3.5a1.5 1.5 0 0 1 3 0V4a1 1 0 0 0 1 1h3a1 1 0 0 1 1 1v2.5a1.5 1.5 0 0 1-3 0V8a1 1 0 0 0-1-1H7.5a1 1 0 0 0-1 1v2.5a1.5 1.5 0 0 1-3 0V8a1 1 0 0 0-1-1H1a1 1 0 0 1-1-1V3.5a1.5 1.5 0 0 1 3 0V4a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-1V3.5ZM8.5 7v1.5a1.5 1.5 0 0 0 3 0V7a1 1 0 0 1 1-1h3a1 1 0 0 0 1 1v1.5a1.5 1.5 0 0 0 3 0V7a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v1.5a1.5 1.5 0 0 1-3 0V7a1 1 0 0 0-1-1H13a1 1 0 0 1-1 1v1.5a1.5 1.5 0 0 1-3 0V7a1 1 0 0 0-1-1H7.5a1 1 0 0 0-1 1v1.5a1.5 1.5 0 0 1-3 0V7a1 1 0 0 1 1-1H5a1 1 0 0 0 1 1v1.5a1.5 1.5 0 0 0 3 0V7a1 1 0 0 1-1-1h-.5a1 1 0 0 1-1-1v-.5a.5.5 0 0 1 .5-.5h.5Z" /></svg>
              Rebuild Table...
            </button>
          </li>
          <li>
            <button onClick={() => handleAction(onEnhance)} className="w-full flex items-center gap-3 text-left px-4 py-2 hover:bg-brand-primary/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9Z" clipRule="evenodd" /></svg>
              Enhance Table...
            </button>
          </li>
          <div className="my-1 h-px bg-brand-border" />
          <li>
            <button onClick={() => handleAction(onDelete)} className="w-full flex items-center gap-3 text-left px-4 py-2 text-red-400 hover:bg-red-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .53 1.405c.78-.246 1.559-.39 2.335-.453V16.25A2.75 2.75 0 0 0 8.75 19h2.5A2.75 2.75 0 0 0 14 16.25V5.192c.776.063 1.555.207 2.335.453a.75.75 0 0 0 .53-1.405c-.786-.248-1.57-.391-2.365-.468V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.5.66 1.5 1.5v8.5c0 .84-.66 1.5-1.5 1.5s-1.5-.66-1.5-1.5V5.5C8.5 4.66 9.16 4 10 4Z" clipRule="evenodd" /></svg>
              Delete Table
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default ContextMenu;