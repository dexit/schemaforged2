
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Column, Table, DbType } from '../../types';
import { DB_DATA_TYPES } from '../../utils/constants';

interface ColumnEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    column: Column;
    table: Table;
    allTables: Table[];
    onSave: (newColumnData: Partial<Column>) => void;
    dbType: DbType;
}

const ColumnEditorModal: React.FC<ColumnEditorModalProps> = ({ isOpen, onClose, column, table, allTables, onSave, dbType }) => {
    const [formData, setFormData] = useState<Partial<Column>>({});

    useEffect(() => {
        if (column) {
            setFormData({ ...column });
        }
    }, [column]);

    if (!column || !table) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleFkTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fkTableName = e.target.value;
        if (fkTableName === '') {
            setFormData(prev => ({
                ...prev,
                isForeignKey: false,
                foreignKeyTable: null,
                foreignKeyColumn: null,
            }));
        } else {
            const targetTable = allTables.find(t => t.name === fkTableName);
            const targetPk = targetTable?.columns.find(c => c.isPrimaryKey);
            setFormData(prev => ({
                ...prev,
                isForeignKey: true,
                foreignKeyTable: fkTableName,
                foreignKeyColumn: targetPk?.name || null, // Default to PK of target
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const foreignTable = allTables.find(t => t.name === formData.foreignKeyTable);
    const foreignKeyColumns = foreignTable?.columns.map(c => c.name) || [];

    const footer = (
        <>
            <button onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-500 transition-colors mr-2">Cancel</button>
            <button onClick={handleSubmit} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-primary-hover">Save Changes</button>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Column: ${column.name}`} footer={footer}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary">Column Name</label>
                        <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border border-brand-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"/>
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-brand-text-secondary">Data Type</label>
                        <select name="type" id="type" value={formData.type || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border border-brand-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none">
                            {DB_DATA_TYPES[dbType].map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-brand-border">
                     <h3 className="text-lg font-semibold">Constraints</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" name="isPrimaryKey" checked={!!formData.isPrimaryKey} onChange={handleInputChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-brand-primary focus:ring-brand-primary"/>
                            <span>Primary Key</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" name="isUnique" checked={!!formData.isUnique} onChange={handleInputChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-brand-primary focus:ring-brand-primary" />
                            <span>Unique</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" name="isNullable" checked={!!formData.isNullable} onChange={handleInputChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-brand-primary focus:ring-brand-primary" />
                            <span>Nullable</span>
                        </label>
                    </div>
                </div>

                 <div className="space-y-2 pt-4 border-t border-brand-border">
                     <h3 className="text-lg font-semibold">Foreign Key Relationship</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="foreignKeyTable" className="block text-sm font-medium text-brand-text-secondary">References Table</label>
                            <select name="foreignKeyTable" id="foreignKeyTable" value={formData.foreignKeyTable || ''} onChange={handleFkTableChange} className="mt-1 block w-full bg-gray-800 border border-brand-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                <option value="">None</option>
                                {allTables.filter(t => t.name !== table.name).map(t => (
                                    <option key={t.name} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        {formData.isForeignKey && (
                            <div>
                                <label htmlFor="foreignKeyColumn" className="block text-sm font-medium text-brand-text-secondary">References Column</label>
                                <select name="foreignKeyColumn" id="foreignKeyColumn" value={formData.foreignKeyColumn || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border border-brand-border rounded-md p-2 focus:ring-2 focus:ring-brand-primary focus:outline-none disabled:bg-gray-700" disabled={!foreignTable}>
                                     {foreignKeyColumns.map(colName => (
                                        <option key={colName} value={colName}>{colName}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                 </div>
            </form>
        </Modal>
    );
};

export default ColumnEditorModal;
