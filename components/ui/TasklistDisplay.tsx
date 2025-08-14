import React from 'react';
import { EnhancementTask } from '../../types';

interface TasklistDisplayProps {
    tasks: EnhancementTask[];
}

const TasklistDisplay: React.FC<TasklistDisplayProps> = ({ tasks }) => {
    if (!tasks || tasks.length === 0) {
        return (
            <div className="text-center py-10 text-brand-text-secondary">
                <p>The AI did not provide an action plan.</p>
            </div>
        );
    }
    return (
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
            {tasks.map((task, index) => (
                <div key={index} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 bg-indigo-500/20 rounded-full w-8 h-8 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-indigo-300">
                          <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.458 5.152l.134.133a.75.75 0 0 1-1.06 1.06l-.134-.133a7 7 0 0 1 11.36-6.528l.133.133a.75.75 0 0 1-1.06 1.06l-.133-.133ZM4.688 8.576a5.5 5.5 0 0 1 9.458-5.152l-.134-.133a.75.75 0 0 1 1.06-1.06l.134.133a7 7 0 0 1-11.36 6.528l-.133-.133a.75.75 0 0 1 1.06-1.06l.133.133Z" clipRule="evenodd" />
                          <path d="m11.343 5.332.062.062a.75.75 0 0 1-1.06 1.06l-.062-.062a.75.75 0 0 1 1.06-1.06Zm-3.182 8.252-.062.062a.75.75 0 1 0 1.06 1.06l.062-.062a.75.75 0 1 0-1.06-1.06Z" />
                        </svg>
                    </div>
                    <div className="flex-grow">
                        <h4 className="font-semibold text-brand-text-primary">{task.title}</h4>
                        <p className="text-sm text-brand-text-secondary mt-1">{task.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TasklistDisplay;