import React, { useState } from 'react';
import { Switch, Tooltip } from '@janhq/joi';
import { KnowledgeFileRecord } from '@/utils/file';
import { AgentInstructionModal } from './AgentInstructionModal';
import { FileListHeader } from './FileListHeader';
import { FileItem } from './FileItem';

interface FileListProps {
    files: KnowledgeFileRecord[];
    onFileSelect: (file: KnowledgeFileRecord) => void;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteFile: (file: KnowledgeFileRecord) => void;
    onToggleFile: (id: string) => void;
    isLoading?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
    files,
    onFileSelect,
    onFileUpload,
    onDeleteFile,
    onToggleFile,
    isLoading
}) => {
    const [contextMenu, setContextMenu] = useState<{ visible: boolean, file?: KnowledgeFileRecord | null }>({ visible: false, file: null });
    const [showPromptModal, setShowPromptModal] = useState(false);

    const [promptError, setPromptError] = useState<string | undefined>(undefined);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFileUpload(event);
    };

    return (
        <div className="p-3">
            <FileListHeader
                onUpload={() => document.getElementById('file-upload')?.click()}
                onOpenAgentInstruction={() => setShowPromptModal(true)}
                isLoading={isLoading}
            />

            <AgentInstructionModal
                isOpen={showPromptModal}
                onOpenChange={setShowPromptModal}
                error={promptError}
            />

            <input
                id="file-upload"
                type="file"
                accept="application/pdf,.md,text/markdown"
                onChange={handleFileUpload}
                className="hidden"
                multiple
                disabled={isLoading}
            />

            <ul className="space-y-1 mt-2">
                {files.map((file) => (
                    <li key={file.id} className="flex items-center gap-2">
                        <Tooltip
                            trigger={
                                <div>
                                    <Switch
                                        checked={file.enabled ?? false}
                                        onChange={() => onToggleFile(file.id)}
                                    />
                                </div>
                            }
                            content={file.enabled ? 'Disable this document as knowledge enhancement' : 'Enable this document as knowledge enhancement'}
                            side="right"
                        />
                        <div className="flex-1">
                            <FileItem
                                file={file}
                                onSelect={onFileSelect}
                                onContextMenu={(file) => setContextMenu({ visible: !contextMenu.visible, file })}
                                isContextMenuVisible={contextMenu.visible && contextMenu.file?.id === file.id}
                                onDelete={onDeleteFile}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}; 