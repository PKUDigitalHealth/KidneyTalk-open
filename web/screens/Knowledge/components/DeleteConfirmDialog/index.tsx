import React from 'react';
import { Button } from '@janhq/joi';
import {KnowledgeFileRecord} from '@/utils/file';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    file?: KnowledgeFileRecord;
    onClose: () => void;
    onConfirm: (file: KnowledgeFileRecord) => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    isOpen,
    file,
    onClose,
    onConfirm
}) => {
    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
                <h2 className="font-medium mb-2">确认删除</h2>
                <p>你确定要删除文件 "{file.name}" 吗？</p>
                <div className="flex justify-end mt-4">
                    <Button onClick={onClose} className="mr-2">取消</Button>
                    <Button
                        onClick={() => onConfirm(file)}
                        theme="destructive"
                    >
                        删除
                    </Button>
                </div>
            </div>
        </div>
    );
}; 