import React from 'react';
import { Trash2Icon } from 'lucide-react';
import { KnowledgeFileRecord } from '@/utils/file';
import { twMerge } from 'tailwind-merge';

interface ContextMenuProps {
    file: KnowledgeFileRecord;
    isVisible: boolean;
    onDelete: (file: KnowledgeFileRecord) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    file,
    isVisible,
    onDelete,
}) => {
    return (
        <div
            className={twMerge(
                'absolute right-0 z-50 w-40 overflow-hidden rounded-lg border border-[hsla(var(--app-border))] bg-[hsla(var(--app-bg))] shadow-lg',
                isVisible ? 'visible' : 'invisible'
            )}
        >
            <div
                className="flex cursor-pointer items-center space-x-2 px-4 py-2 hover:bg-[hsla(var(--dropdown-menu-hover-bg))]"
                onClick={(e) => {
                    onDelete(file);
                    e.stopPropagation();
                }}
            >
                <Trash2Icon
                    size={16}
                    className="text-[hsla(var(--destructive-bg))]"
                />
                <span className="text-bold text-[hsla(var(--destructive-bg))]">
                    Delete
                </span>
            </div>
        </div>
    );
}; 