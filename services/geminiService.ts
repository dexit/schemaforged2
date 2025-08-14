
import { GoogleGenAI, Type } from "@google/genai";
import { Schema, DbType, ApiLog, Table, ModelConfig, ProposedEnhancement } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please set it in your environment.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = 'gemini-2.5-flash';

// This is the schema the AI must adhere to for generating/updating schemas
const schemaDefinition = {
    type: Type.OBJECT, properties: {
        tables: { type: Type.ARRAY, items: { type: Type.OBJECT,
            properties: { name: { type: Type.STRING }, columns: { type: Type.ARRAY, items: { type: Type.OBJECT,
                properties: { name: { type: Type.STRING }, type: { type: Type.STRING }, isPrimaryKey: { type: Type.BOOLEAN }, isForeignKey: { type: Type.BOOLEAN }, foreignKeyTable: { type: Type.STRING }, foreignKeyColumn: { type: Type.STRING }, isNullable: { type: Type.BOOLEAN }, isUnique: { type: Type.BOOLEAN } }, required: ['name', 'type'] } } }, required: ['name', 'columns'] } },
        views: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, query: { type: Type.STRING } }, required: ['name', 'query'] } }
    }, required: ['tables']
};

// This is the schema the AI must adhere to for the "Enhance" feature
const enhancementSchemaDefinition = {
    type: Type.OBJECT,
    properties: {
        proposedSchema: schemaDefinition,
        enhancementTasks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ['title', 'description']
            }
        }
    },
    required: ['proposedSchema', 'enhancementTasks']
};


export const parseJsonResponse = (responseText: string): any => {
    const text = responseText.trim();
    // The Gemini API with a responseSchema should return a clean JSON string.
    // It may sometimes be wrapped in markdown, so we handle that.
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonToParse = fenceMatch ? fenceMatch[1].trim() : text;

    // Handle cases where the model might still return empty or non-json responses
    if (!jsonToParse) {
        throw new Error("AI returned an empty response.");
    }

    try {
        return JSON.parse(jsonToParse);
    } catch (e) {
        console.error("JSON parsing failed. Original text:", responseText, "Attempted to parse:", jsonToParse);
        throw new Error("AI returned invalid or malformed JSON. Check the API logs for the raw response.");
    }
};

export async function* generateSchemaFromPrompt(
    prompt: string, dbType: DbType, addApiLog: (log: Omit<ApiLog, 'id' | 'timestamp'>) => void, modelConfig: ModelConfig
): AsyncGenerator<string, Schema, void> {
    const systemInstruction = `
You are an expert database architect. Your task is to design a database schema based on a user's description.
You MUST output your response as a single, valid JSON object that adheres to the specified TypeScript interface.
DO NOT include any explanatory text, markdown formatting, code fences, or anything else before or after the JSON object.
The output must be only the raw JSON.

The JSON output MUST match this TypeScript interface:
interface Schema { tables: Table[]; views?: View[]; }
interface Table { name: string; columns: Column[]; }
interface Column { name: string; type: string; isPrimaryKey?: boolean; isForeignKey?: boolean; foreignKeyTable?: string | null; foreignKeyColumn?: string | null; isNullable?: boolean; isUnique?: boolean; }
interface View { name: string; query: string; }

Crucial Guidelines:
1.  **SNAKE CASE**: All table and column names must be in snake_case.
2.  **PRIMARY KEYS**: Every table MUST have a primary key, typically 'id'. For PostgreSQL, use 'SERIAL' or 'BIGSERIAL'. For MySQL, use 'INT AUTO_INCREMENT'. For SQLite (including Cloudflare D1), use 'INTEGER PRIMARY KEY'.
3.  **FOREIGN KEYS**: Establish foreign key relationships where appropriate.
4.  **NULLABILITY**: Primary keys and foreign keys should generally have 'isNullable' set to false.
5.  **TIMESTAMPS**: Every table SHOULD have \`created_at\` and \`updated_at\` columns (e.g., TEXT for SQLite, TIMESTAMP WITH TIME ZONE for PostgreSQL, DATETIME for MySQL) to track record creation and modification.
6.  **VALIDITY**: The generated JSON must be 100% valid and parsable.
`;
    const userContent = `
Database type: ${dbType}.
User-provided description: "${prompt}"
`;
    const requestLog = { model: modelName, prompt: `System: ${systemInstruction}\n\nUser: ${userContent}` };
    let fullResponseText = '';
    try {
        const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents: userContent,
            config: {
                ...modelConfig,
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schemaDefinition,
            }
        });
        for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
                fullResponseText += text;
                yield text;
            }
        }
        addApiLog({ request: requestLog, response: fullResponseText });
        return parseJsonResponse(fullResponseText);
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        addApiLog({ request: requestLog, response: fullResponseText, error });
        throw new Error(error);
    }
}

export const generateSqlFromSchema = (schema: Schema, dbType: DbType): string => {
    const quote = (name: string) => (dbType === 'mysql' ? `\`${name}\`` : `"${name}"`);
    const createTablesSql = schema.tables.map(table => {
        const columnsSql = table.columns.map(col => {
            let columnDef = `  ${quote(col.name)} ${col.type.toUpperCase()}`;
            if (col.isPrimaryKey) {
                if (dbType === 'mysql' && col.type.toLowerCase() === 'int') columnDef += ' AUTO_INCREMENT PRIMARY KEY';
                else if (dbType === 'sqlite' && col.type.toLowerCase() === 'integer') columnDef += ' PRIMARY KEY AUTOINCREMENT';
                else if (dbType !== 'postgresql' || !col.type.toLowerCase().includes('serial')) columnDef += ' PRIMARY KEY';
            }
            if (col.isUnique && !col.isPrimaryKey) columnDef += ' UNIQUE';
            if (col.isNullable === false) columnDef += ' NOT NULL';
            return columnDef;
        }).join(',\n');
        const foreignKeysSql = table.columns
            .filter(col => col.isForeignKey && col.foreignKeyTable && col.foreignKeyColumn)
            .map(col => `  CONSTRAINT ${quote(`fk_${table.name}_${col.name}`)} FOREIGN KEY (${quote(col.name)}) REFERENCES ${quote(col.foreignKeyTable!)}(${quote(col.foreignKeyColumn!)})`)
            .join(',\n');
        let createTableStatement = `CREATE TABLE IF NOT EXISTS ${quote(table.name)} (\n${columnsSql}`;
        if (foreignKeysSql) createTableStatement += `,\n${foreignKeysSql}`;
        createTableStatement += '\n);';
        return createTableStatement;
    }).join('\n\n');
    const createViewsSql = (schema.views || []).map(view => `CREATE OR REPLACE VIEW ${quote(view.name)} AS\n${view.query};`).join('\n\n');
    return [createTablesSql, createViewsSql].filter(Boolean).join('\n\n');
};

export async function generateIndexSuggestions(
    schema: Schema, dbType: DbType, addApiLog: (log: Omit<ApiLog, 'id' | 'timestamp'>) => void
): Promise<string> {
    const systemInstruction = `
You are a senior database performance expert.
Your task is to provide a list of recommended SQL CREATE INDEX statements to optimize query performance for a given schema.
Focus on indexing foreign key columns, columns frequently used in WHERE clauses, and columns used for sorting.
Do not suggest indexes on primary keys as they are typically indexed automatically.
Return ONLY the raw SQL statements, each on a new line. Do not include any explanatory text, markdown, or code fences.
If no indexes are recommended, return an empty response.
`;
    const userContent = `
Database type: ${dbType}
Schema:
${JSON.stringify(schema, null, 2)}
`;
    const requestLog = { model: modelName, prompt: `System: ${systemInstruction}\n\nUser: ${userContent}` };
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: userContent,
            config: {
                systemInstruction,
                temperature: 0.2
            }
        });
        const responseText = response.text;
        addApiLog({ request: requestLog, response: responseText });
        return responseText.trim();
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        addApiLog({ request: requestLog, response: '', error });
        console.error("Failed to generate index suggestions:", error);
        return `-- Failed to generate index suggestions: ${error}`;
    }
}

export const rebuildTableViaAI = async (
    originalSchema: Schema, targetTable: Table, instruction: string, dbType: DbType, addApiLog: (log: Omit<ApiLog, 'id' | 'timestamp'>) => void, modelConfig: ModelConfig
): Promise<Schema> => {
    const systemInstruction = `
You are an expert database architect. Your task is to modify a single table within an existing database schema based on a user's instruction.
You MUST output your response as a single, valid JSON object that represents the ENTIRE, UPDATED schema.
DO NOT include any explanatory text, markdown formatting, or anything else. The output must be only the raw JSON.
You must return the entire schema object, not just the modified table.
Maintain existing tables and columns unless the instruction implies a change.
If the table name is changed, reflect it in the 'name' property and update any foreign keys that point to it.
All table and column names must be in snake_case.
The response must be 100% parsable and conform to the full Schema interface provided in the user instruction.
`;
    const userContent = `
Database type: ${dbType}
User's modification instruction for table "${targetTable.name}": "${instruction}"

Current full database schema (modify the "${targetTable.name}" table within this):
${JSON.stringify(originalSchema, null, 2)}
`;
    const requestLog = { model: modelName, prompt: `System: ${systemInstruction}\n\nUser: ${userContent}` };
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: userContent,
            config: {
                ...modelConfig,
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schemaDefinition
            }
        });
        const responseText = response.text;
        addApiLog({ request: requestLog, response: responseText });
        const parsedSchema: Schema = parseJsonResponse(responseText);
        if (!parsedSchema || !Array.isArray(parsedSchema.tables)) throw new Error("AI response is not a valid Schema object.");
        return parsedSchema;
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        addApiLog({ request: requestLog, response: '', error });
        throw new Error(error);
    }
};

export const enhanceSchemaViaAI = async (
    schema: Schema, dbType: DbType, addApiLog: (log: Omit<ApiLog, 'id' | 'timestamp'>) => void, modelConfig: ModelConfig, target?: Table
): Promise<ProposedEnhancement> => {
    const scope = target ? `the '${target.name}' table and its immediate relationships` : 'the entire schema holistically';
    const targetJSON = target ? `\nTarget Table:\n${JSON.stringify(target, null, 2)}` : '';

    const systemInstruction = `
You are an expert database architect. Your task is to analyze and enhance a database schema.
Based on your analysis, you will return a new, improved version of the entire schema, along with a list of tasks you performed.
You MUST output your response as a single, valid JSON object. DO NOT include any explanatory text, markdown formatting, or anything else.
The output must be only the raw JSON.

Look for improvements such as:
- **Normalization:** Add join tables for many-to-many relationships, split tables to reduce redundancy.
- **Relationships:** Add missing foreign keys to enforce integrity.
- **Best Practices:** Add missing standard columns like 'created_at', 'updated_at'. Ensure consistent naming (snake_case). Choose optimal data types.
- **Data Integrity**: Add constraints like 'UNIQUE' where appropriate (e.g., on email columns).

The response must be 100% parsable and conform to the ProposedEnhancement interface.
`;
    const userContent = `
Database type: ${dbType}.
Analysis scope: ${scope}.

Current database schema:
${JSON.stringify(schema, null, 2)}
${targetJSON}

Return a single JSON object matching this interface:
interface ProposedEnhancement {
  proposedSchema: Schema; // The complete, updated schema object.
  enhancementTasks: { title: string; description: string; }[]; // A list of changes you made and your reasoning.
}
`;
    const requestLog = { model: modelName, prompt: `System: ${systemInstruction}\n\nUser: ${userContent}` };
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: userContent,
            config: {
                ...modelConfig,
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: enhancementSchemaDefinition,
            }
        });
        const responseText = response.text;
        addApiLog({ request: requestLog, response: responseText });
        const parsedEnhancement: ProposedEnhancement = parseJsonResponse(responseText);
        if (!parsedEnhancement || !parsedEnhancement.proposedSchema || !Array.isArray(parsedEnhancement.enhancementTasks)) {
            throw new Error("AI response is not a valid ProposedEnhancement object.");
        }
        return parsedEnhancement;
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        addApiLog({ request: requestLog, response: '', error });
        throw new Error(error);
    }
}
