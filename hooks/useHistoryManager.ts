import { useState, useEffect, useCallback } from 'react';
import { HistoryItem, Schema, DbType } from '../types';

const LS_HISTORY_KEY = 'gemini-db-designer-history-v2';

export function useHistoryManager() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(LS_HISTORY_KEY);
            if (storedHistory) {
                const parsedHistory = JSON.parse(storedHistory);
                setHistory(parsedHistory);
                if (parsedHistory.length > 0) {
                    setCurrentDesignId(parsedHistory[0].id);
                }
            }
        } catch (e) {
            console.error("Failed to load history from localStorage", e);
        }
    }, []);

    const saveHistoryToLocalStorage = useCallback((newHistory: HistoryItem[]) => {
        try {
            localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(newHistory));
        } catch (e) {
            console.error("Failed to save history to localStorage", e);
        }
    }, []);

    const handleSaveToHistory = useCallback((name: string, prompt: string, dbType: DbType, schema: Schema) => {
        const idToSave = currentDesignId || crypto.randomUUID();
        const newHistoryItem: HistoryItem = {
            id: idToSave,
            name,
            timestamp: new Date().toISOString(),
            prompt,
            dbType,
            schema,
        };

        const existingIndex = history.findIndex(item => item.id === idToSave);
        let updatedHistory;
        if (existingIndex > -1) {
            updatedHistory = [...history];
            updatedHistory[existingIndex] = newHistoryItem;
        } else {
            updatedHistory = [newHistoryItem, ...history];
        }
        setHistory(updatedHistory);
        saveHistoryToLocalStorage(updatedHistory);
        setCurrentDesignId(newHistoryItem.id);

    }, [history, currentDesignId, saveHistoryToLocalStorage]);

    const handleLoadFromHistory = useCallback((
        item: HistoryItem,
        setPrompt: (p: string) => void,
        setDbType: (d: DbType) => void,
        setSchema: (s: Schema | null) => void
    ) => {
        setPrompt(item.prompt);
        setDbType(item.dbType);
        setSchema(item.schema);
        setCurrentDesignId(item.id);
        setIsHistoryModalOpen(false);
    }, []);

    const handleDeleteFromHistory = useCallback((id: string) => {
        const updatedHistory = history.filter(item => item.id !== id);
        setHistory(updatedHistory);
        saveHistoryToLocalStorage(updatedHistory);
    }, [history, saveHistoryToLocalStorage]);

    const handleNewDesign = useCallback((
        setPrompt: (p: string) => void,
        setSchema: (s: Schema | null) => void,
        setAiInteractionState: (cb: (s: any) => any) => void
    ) => {
        setPrompt('');
        setSchema(null);
        setCurrentDesignId(crypto.randomUUID());
        // Reset all AI related states to their initial values
        setAiInteractionState((prev: any) => ({
            isOpen: false,
            mode: null,
            targetTable: null,
            isLoading: false,
            error: null,
        }));
    }, []);

    return {
        history,
        currentDesignId,
        isHistoryModalOpen,
        setIsHistoryModalOpen,
        handleSaveToHistory,
        handleLoadFromHistory,
        handleDeleteFromHistory,
        handleNewDesign,
    };
}