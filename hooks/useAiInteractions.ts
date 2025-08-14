

import { useState, useCallback } from 'react';
import { Schema, DbType, ApiLog, Table, ModelConfig, ProposedEnhancement } from '../types';
import { 
    generateSchemaFromPrompt, 
    generateSqlFromSchema, 
    enhanceSchemaViaAI,
    rebuildTableViaAI,
    generateIndexSuggestions
} from '../services/geminiService';

const initialInteractionState = {
    isOpen: false,
    mode: null as 'rebuild' | null,
    targetTable: null as Table | null,
    isLoading: false,
    error: null as string | null,
};

export function useAiInteractions(
    schema: Schema | null,
    setSchema: React.Dispatch<React.SetStateAction<Schema | null>>
) {
    const [prompt, setPrompt] = useState<string>('');
    const [dbType, setDbType] = useState<DbType>('postgresql');
    const [modelConfig, setModelConfig] = useState<ModelConfig>({ temperature: 0.4, topK: 32, topP: 1 });
    
    const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [streamingPreview, setStreamingPreview] = useState('');
    const [isPreviewing, setIsPreviewing] = useState(false);

    const [originalSchemaForDiff, setOriginalSchemaForDiff] = useState<Schema | null>(null);
    const [proposedEnhancement, setProposedEnhancement] = useState<ProposedEnhancement | null>(null);
    const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
    const [aiInteractionState, setAiInteractionState] = useState(initialInteractionState);

    const [suggestedIndexes, setSuggestedIndexes] = useState('');
    const [areIndexesLoading, setAreIndexesLoading] = useState(false);

    const addApiLog = useCallback((log: Omit<ApiLog, 'id' | 'timestamp'>) => {
        setApiLogs(prev => [{ ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() }, ...prev].slice(0, 50));
    }, []);

    const handleGenerate = useCallback(async (prompt: string, dbType: DbType, modelConfig: ModelConfig) => {
        if (!prompt) {
            setError('Prompt cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSchema(null);
        setStreamingPreview('');
        setIsPreviewing(true);
        setSuggestedIndexes('');

        try {
            const iterator = generateSchemaFromPrompt(prompt, dbType, addApiLog, modelConfig);
            
            let fullText = '';
            let result: IteratorResult<string, Schema> = await iterator.next();
            while (!result.done) {
                if (result.value) {
                    fullText += result.value;
                    setStreamingPreview(fullText);
                }
                result = await iterator.next();
            }
            
            const finalSchema = result.value;

            if (!finalSchema || !Array.isArray(finalSchema.tables)) {
                 throw new Error("AI did not return a valid schema object.");
            }
            
            setSchema(finalSchema);

            // Non-blocking call for index suggestions
            setAreIndexesLoading(true);
            generateIndexSuggestions(finalSchema, dbType, addApiLog)
                .then(setSuggestedIndexes)
                .finally(() => setAreIndexesLoading(false));

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate schema: ${errorMessage}`);
            setSchema(null);
        } finally {
            setIsPreviewing(false);
            setIsLoading(false);
        }
    }, [addApiLog, setSchema]);

    const handleRebuildSubmit = useCallback(async (instruction: string, targetTable: Table, dbType: DbType, modelConfig: ModelConfig) => {
        if(!schema) return;
        setAiInteractionState(prev => ({ ...prev, isLoading: true, error: null }));
        setOriginalSchemaForDiff(schema);
        try {
            const newSchema = await rebuildTableViaAI(schema, targetTable, instruction, dbType, addApiLog, modelConfig);
            setProposedEnhancement({ proposedSchema: newSchema, enhancementTasks: [{title: 'Rebuilt Table', description: `Table '${targetTable.name}' was rebuilt based on your instruction.`}] });
            setIsDiffModalOpen(true);
            setAiInteractionState(initialInteractionState); // Close input modal
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred';
            setAiInteractionState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
            setOriginalSchemaForDiff(null);
        }
    }, [addApiLog, schema]);

    const handleEnhanceRequest = useCallback(async (dbType: DbType, modelConfig: ModelConfig, targetTable?: Table) => {
        if(!schema) return;
        setIsLoading(true);
        setError(null);
        setOriginalSchemaForDiff(schema);
        try {
            const enhancement = await enhanceSchemaViaAI(schema, dbType, addApiLog, modelConfig, targetTable);
            setProposedEnhancement(enhancement);
            setIsDiffModalOpen(true);
        } catch(e) {
            const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred';
            setError(errorMsg);
            setOriginalSchemaForDiff(null);
        } finally {
            setIsLoading(false);
        }
    }, [addApiLog, schema]);
    
    const acceptProposedSchema = useCallback(() => {
        if (proposedEnhancement) {
            setSchema(proposedEnhancement.proposedSchema);
        }
        setProposedEnhancement(null);
        setIsDiffModalOpen(false);
        setOriginalSchemaForDiff(null);
    }, [proposedEnhancement, setSchema]);
    
    const rejectProposedSchema = useCallback(() => {
        setProposedEnhancement(null);
        setIsDiffModalOpen(false);
        setOriginalSchemaForDiff(null);
    }, []);

    const generateSql = useCallback((schemaToSql: Schema, dbTypeToSql: DbType) => {
        return generateSqlFromSchema(schemaToSql, dbTypeToSql);
    }, []);

    return {
        prompt, setPrompt,
        dbType, setDbType,
        aiInteractionState, setAiInteractionState,
        modelConfig, setModelConfig,
        isLoading, error, apiLogs,
        streamingPreview, isPreviewing,
        originalSchemaForDiff,
        proposedEnhancement,
        isDiffModalOpen, setIsDiffModalOpen,
        suggestedIndexes, areIndexesLoading,
        handleGenerate,
        handleRebuildSubmit,
        handleEnhanceRequest,
        acceptProposedSchema,
        rejectProposedSchema,
        generateSql
    };
}
