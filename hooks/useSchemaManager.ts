
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNodesState, useEdgesState, Node, Edge, MarkerType, Connection, EdgeChange, NodeChange, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { Schema, Table, Column } from '../types';

const nodeWidth = 320;
const nodeHeight = 60; // Base height for table header
const columnHeight = 45; // Height per column
const horizontalGap = 100;
const verticalGap = 40;

const getLayoutedElements = (schema: Schema) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (!schema || !schema.tables) return { nodes, edges };

    const adjList: { [key: string]: string[] } = {};
    const inDegree: { [key: string]: number } = {};
    const tableMap = new Map(schema.tables.map(t => [t.name, t]));

    schema.tables.forEach(table => {
        adjList[table.name] = [];
        inDegree[table.name] = 0;
    });

    schema.tables.forEach(table => {
        table.columns.forEach(column => {
            if (column.isForeignKey && column.foreignKeyTable && tableMap.has(column.foreignKeyTable)) {
                adjList[column.foreignKeyTable].push(table.name);
                inDegree[table.name]++;
            }
        });
    });

    const queue: string[] = schema.tables.filter(t => inDegree[t.name] === 0).map(t => t.name);
    const layoutColumns: string[][] = [];
    
    while(queue.length > 0) {
        const levelSize = queue.length;
        const currentColumn: string[] = [];
        for (let i = 0; i < levelSize; i++) {
            const u = queue.shift()!;
            currentColumn.push(u);
            (adjList[u] || []).forEach(v => {
                inDegree[v]--;
                if (inDegree[v] === 0) queue.push(v);
            });
        }
        layoutColumns.push(currentColumn);
    }
    
    const processedNodes = new Set(layoutColumns.flat());
    const remainingNodes = schema.tables.filter(t => !processedNodes.has(t.name));
    if (remainingNodes.length > 0) layoutColumns.push(remainingNodes.map(n => n.name));

    let currentX = 0;
    layoutColumns.forEach(column => {
        let currentY = 0;
        let maxNodeWidthInColumn = 0;
        column.forEach(nodeId => {
            const table = tableMap.get(nodeId);
            if(table) {
                const dynamicHeight = nodeHeight + (table.columns.length || 0) * columnHeight;
                nodes.push({ id: table.name, type: 'table', position: { x: currentX, y: currentY }, data: { table } });
                currentY += dynamicHeight + verticalGap;
                maxNodeWidthInColumn = Math.max(maxNodeWidthInColumn, nodeWidth);
            }
        });
        currentX += maxNodeWidthInColumn + horizontalGap;
    });

    schema.tables.forEach(table => {
        table.columns.forEach(column => {
            if (column.isForeignKey && column.foreignKeyTable && tableMap.has(column.foreignKeyTable) && column.foreignKeyColumn) {
                edges.push({
                    id: `e-${table.name}-${column.name}-${column.foreignKeyTable}`,
                    source: column.foreignKeyTable!,
                    sourceHandle: `${column.foreignKeyTable!}__${column.foreignKeyColumn!}`,
                    target: table.name,
                    targetHandle: `${table.name}__${column.name}`,
                    type: 'smoothstep',
                    style: { stroke: '#4f46e5', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' },
                });
            }
        });
    });

    return { nodes, edges };
};

export function useSchemaManager(
    schema: Schema | null,
    setSchema: React.Dispatch<React.SetStateAction<Schema | null>>
) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; nodeId: string; } | null>(null);
    const [editingColumn, setEditingColumn] = useState<{tableName: string; columnName: string} | null>(null);
    const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
    const schemaRef = useRef(schema);
    schemaRef.current = schema;
    
    // This ref tracks if a layout has been applied to the current schema instance
    const layoutAppliedRef = useRef(false);

    const onEdgeMouseEnter = useCallback((_event: React.MouseEvent, edge: Edge) => setHoveredEdge(edge.id), []);
    const onEdgeMouseLeave = useCallback(() => setHoveredEdge(null), []);

    const updateSchema = useCallback((action: any) => {
        setSchema(currentSchema => {
            if (!currentSchema && action.type !== 'add-table' && action.type !== 'import') return currentSchema;

            switch (action.type) {
                case 'update-table-name': {
                    if(!currentSchema) return null;
                    const { oldName, newName } = action.payload;
                    if (!newName.trim() || newName === oldName || currentSchema.tables.some(t => t.name === newName)) {
                        if (newName !== oldName) alert(`A table named "${newName}" already exists.`);
                        return currentSchema;
                    }
                    const newTables = currentSchema.tables.map(t => {
                        if (t.name === oldName) return { ...t, name: newName };
                        return {
                            ...t,
                            columns: t.columns.map(c => 
                                c.foreignKeyTable === oldName ? { ...c, foreignKeyTable: newName } : c
                            )
                        };
                    });
                    return { ...currentSchema, tables: newTables };
                }
                case 'update-column': {
                    if(!currentSchema) return null;
                    const { tableName, columnName, newColumn } = action.payload;
                    const newTables = currentSchema.tables.map(t => {
                        if (t.name === tableName) {
                            return { ...t, columns: t.columns.map(c => c.name === columnName ? newColumn : c) };
                        }
                        return t;
                    });
                     return { ...currentSchema, tables: newTables };
                }
                 case 'add-column': {
                    if(!currentSchema) return null;
                    const { tableName } = action.payload;
                    const newTables = currentSchema.tables.map(t => {
                        if (t.name === tableName) {
                            const newColumnName = `new_column_${t.columns.length + 1}`;
                            return {
                                ...t,
                                columns: [...t.columns, { name: newColumnName, type: 'TEXT', isNullable: true }]
                            };
                        }
                        return t;
                    });
                    return { ...currentSchema, tables: newTables };
                }
                case 'delete-column': {
                    if(!currentSchema) return null;
                    const { tableName, columnName } = action.payload;
                    const newTables = currentSchema.tables.map(t => {
                        if (t.name === tableName) {
                            return { ...t, columns: t.columns.filter(c => c.name !== columnName) };
                        }
                        return t;
                    });
                    return { ...currentSchema, tables: newTables };
                }
                case 'add-table': {
                    layoutAppliedRef.current = false; // Force re-layout
                    const newSchema = currentSchema || { tables: [] };
                    const newTableName = `new_table_${(newSchema.tables?.length ?? 0) + 1}`;
                    const newTable: Table = {
                        name: newTableName,
                        columns: [{ name: 'id', type: 'INTEGER', isPrimaryKey: true, isNullable: false }]
                    };
                    return { ...newSchema, tables: [...newSchema.tables, newTable] };
                }
                case 'delete-table': {
                    if(!currentSchema) return null;
                    const { tableName } = action.payload;
                    const newTables = currentSchema.tables.filter(t => t.name !== tableName);
                    setEdges(eds => eds.filter(e => e.source !== tableName && e.target !== tableName));
                    return { ...currentSchema, tables: newTables };
                }
                case 'connect': {
                    if(!currentSchema) return null;
                    const { source, sourceHandle, target, targetHandle } = action.payload;
                    if (!source || !sourceHandle || !target || !targetHandle) return currentSchema;

                    const [sourceTableName, sourceColumnName] = sourceHandle.split('__');
                    const [targetTableName, targetColumnName] = targetHandle.split('__');
                    
                    const newTables = currentSchema.tables.map(t => {
                        if (t.name === sourceTableName) {
                            return {
                                ...t,
                                columns: t.columns.map(c => {
                                    if (c.name === sourceColumnName) {
                                        return { ...c, isForeignKey: true, foreignKeyTable: target, foreignKeyColumn: targetColumnName };
                                    }
                                    return c;
                                })
                            };
                        }
                        return t;
                    });
                    return { ...currentSchema, tables: newTables };
                }
                default:
                    return currentSchema;
            }
        });
    }, [setSchema, setEdges]);
    
    const forceLayout = useCallback(() => {
        if (schemaRef.current) {
            layoutAppliedRef.current = false; // Mark for re-layout
            // This triggers the useEffect below
            setSchema(s => s ? {...s} : null);
        }
    }, []);
    
    useEffect(() => {
        if (schema) {
            let layoutedNodes: Node[];
            let layoutedEdges: Edge[];
            
            // Only perform a full re-layout if the flag is false
            if (!layoutAppliedRef.current) {
                const layout = getLayoutedElements(schema);
                layoutedNodes = layout.nodes;
                layoutedEdges = layout.edges;
                layoutAppliedRef.current = true; // Mark as laid out
            } else {
                 // Otherwise, just regenerate edges and keep existing node positions
                const layout = getLayoutedElements(schema);
                layoutedEdges = layout.edges;
                const nodePositionMap = new Map(nodes.map(n => [n.id, n.position]));
                layoutedNodes = layout.nodes.map(n => ({
                    ...n,
                    position: nodePositionMap.get(n.id) || n.position
                }));
            }

            const finalEdges = layoutedEdges.map(edge => ({
                ...edge,
                style: { ...edge.style, strokeWidth: edge.id === hoveredEdge ? 4 : 2, transition: 'stroke-width 0.2s' },
                animated: edge.id === hoveredEdge
            }));

            const connectedNodeIds = new Set<string>();
            if (hoveredEdge) {
                const edge = finalEdges.find(e => e.id === hoveredEdge);
                if (edge) {
                    connectedNodeIds.add(edge.source);
                    connectedNodeIds.add(edge.target);
                }
            }
            
            setNodes(layoutedNodes.map(node => ({
                ...node,
                data: {
                    table: (node.data as any).table,
                    onUpdate: updateSchema,
                    onEdit: setEditingColumn,
                    isHovered: connectedNodeIds.has(node.id)
                },
            })));
            setEdges(finalEdges);
        } else {
            setNodes([]);
            setEdges([]);
            layoutAppliedRef.current = false;
        }
    }, [schema, hoveredEdge, setNodes, setEdges, updateSchema, nodes]);

    // This effect ensures when schema is set externally (e.g. from history or new), we re-layout
    useEffect(() => {
        layoutAppliedRef.current = false;
    }, [schema]);


    const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
        event.preventDefault();
        setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, nodeId: node.id });
    }, []);

    const closeContextMenu = () => setContextMenu(null);

    const handleConnect = useCallback((params: Connection) => {
        // Swap source and target to always draw from FK to PK
        const { source, sourceHandle, target, targetHandle } = params;
        updateSchema({ type: 'connect', payload: { source: target, sourceHandle: targetHandle, target: source, targetHandle: sourceHandle } });
    }, [updateSchema]);

    return {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        contextMenu,
        editingColumn,
        setEditingColumn,
        handleNodeContextMenu,
        closeContextMenu,
        handleConnect,
        updateSchema,
        forceLayout,
        onEdgeMouseEnter,
        onEdgeMouseLeave,
    };
}
