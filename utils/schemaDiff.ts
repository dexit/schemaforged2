import { Schema, Table, Column } from '../types';

export interface ValueChange<T> {
    oldValue: T;
    newValue: T;
}

export interface ColumnChanges {
    type?: ValueChange<string>;
    isPrimaryKey?: ValueChange<boolean>;
    isForeignKey?: ValueChange<boolean>;
    foreignKeyTable?: ValueChange<string | null | undefined>;
    foreignKeyColumn?: ValueChange<string | null | undefined>;
    isNullable?: ValueChange<boolean>;
    isUnique?: ValueChange<boolean>;
}

export interface AddedColumn {
    name: string;
    newType: string;
    changes: Partial<Column>;
}

export interface DeletedColumn {
    name: string;
    oldType: string;
}

export interface ModifiedColumn {
    name: string;
    changes: ColumnChanges;
}

export type ColumnDiff =
    | (AddedColumn & { status: 'added' })
    | (DeletedColumn & { status: 'deleted' })
    | (ModifiedColumn & { status: 'modified' });

export interface TableDiff {
    name: string;
    status: 'added' | 'deleted' | 'modified';
    columns: {
        added: AddedColumn[];
        deleted: DeletedColumn[];
        modified: ModifiedColumn[];
    };
}

export interface DiffResult {
    tables: {
        added: TableDiff[];
        deleted: TableDiff[];
        modified: TableDiff[];
    };
}

export function diffSchemas(oldSchema: Schema, newSchema: Schema): DiffResult {
    const oldTables = new Map(oldSchema.tables.map(t => [t.name, t]));
    const newTables = new Map(newSchema.tables.map(t => [t.name, t]));

    const result: DiffResult = {
        tables: {
            added: [],
            deleted: [],
            modified: [],
        },
    };

    // Find added and modified tables
    newTables.forEach((newTable, name) => {
        if (!oldTables.has(name)) {
            result.tables.added.push({
                name,
                status: 'added',
                columns: {
                    added: newTable.columns.map(c => ({ name: c.name, newType: c.type, changes: c })),
                    deleted: [],
                    modified: [],
                }
            });
        } else {
            const oldTable = oldTables.get(name)!;
            const tableDiff = diffTables(oldTable, newTable);
            if (tableDiff.columns.added.length > 0 || tableDiff.columns.deleted.length > 0 || tableDiff.columns.modified.length > 0) {
                result.tables.modified.push({
                    name,
                    status: 'modified',
                    columns: tableDiff.columns,
                });
            }
        }
    });

    // Find deleted tables
    oldTables.forEach((oldTable, name) => {
        if (!newTables.has(name)) {
            result.tables.deleted.push({
                name,
                status: 'deleted',
                columns: {
                    added: [],
                    modified: [],
                    deleted: oldTable.columns.map(c => ({ name: c.name, oldType: c.type })),
                }
            });
        }
    });

    return result;
}

function diffTables(oldTable: Table, newTable: Table): Omit<TableDiff, 'status' | 'name'> {
    const oldColumns = new Map(oldTable.columns.map(c => [c.name, c]));
    const newColumns = new Map(newTable.columns.map(c => [c.name, c]));

    const columnsDiff = {
        added: [] as AddedColumn[],
        deleted: [] as DeletedColumn[],
        modified: [] as ModifiedColumn[],
    };

    newColumns.forEach((newCol, name) => {
        if (!oldColumns.has(name)) {
            columnsDiff.added.push({ name, newType: newCol.type, changes: newCol });
        } else {
            const oldCol = oldColumns.get(name)!;
            const colChanges = diffColumns(oldCol, newCol);
            if (Object.keys(colChanges).length > 0) {
                columnsDiff.modified.push({ name, changes: colChanges });
            }
        }
    });

    oldColumns.forEach((oldCol, name) => {
        if (!newColumns.has(name)) {
            columnsDiff.deleted.push({ name, oldType: oldCol.type });
        }
    });

    return { columns: columnsDiff };
}

function diffColumns(oldCol: Column, newCol: Column): ColumnChanges {
    const changes: ColumnChanges = {};
    const keys: (keyof Column)[] = ['type', 'isPrimaryKey', 'isForeignKey', 'foreignKeyTable', 'foreignKeyColumn', 'isNullable', 'isUnique'];
    
    keys.forEach(key => {
        const oldValue = oldCol[key] ?? (key === 'isNullable' ? true : false); // Default isNullable to true if undefined
        const newValue = newCol[key] ?? (key === 'isNullable' ? true : false);
        if (oldValue !== newValue) {
            changes[key] = { oldValue, newValue };
        }
    });

    return changes;
}
