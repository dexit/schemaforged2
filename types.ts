export type DbType = 'mysql' | 'postgresql' | 'sqlite';

export interface Column {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyTable?: string | null;
  foreignKeyColumn?: string | null;
  isNullable?: boolean;
  isUnique?: boolean;
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface View {
  name: string;
  query: string;
}

export interface Schema {
  tables: Table[];
  views?: View[];
}

export interface ApiLog {
  id: string;
  timestamp: string;
  request: {
    model: string;
    prompt: string;
  };
  response: string;
  error?: string;
}

export interface ModelConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
}

export interface HistoryItem {
  id: string;
  name: string;
  timestamp: string;
  prompt: string;
  dbType: DbType;
  schema: Schema;
}

export interface EnhancementTask {
  title: string;
  description: string;
}

export interface ProposedEnhancement {
  proposedSchema: Schema;
  enhancementTasks: EnhancementTask[];
}
