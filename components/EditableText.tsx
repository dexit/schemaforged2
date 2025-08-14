import React, { useState, useEffect } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
}

const EditableText: React.FC<EditableTextProps> = ({ value, onChange, className, inputClassName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue.trim() !== '' && currentValue !== value) {
        onChange(currentValue);
    } else {
        setCurrentValue(value); // revert if empty or unchanged
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentValue(value);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={`bg-gray-800 border border-brand-primary rounded px-1 py-0 w-full ${className} ${inputClassName}`}
      />
    );
  }

  return (
    <span onDoubleClick={handleDoubleClick} className={`${className} cursor-pointer px-1 py-0 rounded`}>
      {value}
    </span>
  );
};

export default EditableText;
