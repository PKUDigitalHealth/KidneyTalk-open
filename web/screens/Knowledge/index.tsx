import React from 'react';
import LeftPanelContainer from '@/containers/LeftPanelContainer';
import { FileList } from './components/FileList';
import { VectorDBSearch } from './components/VectorDBSearch';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { useFileManagement } from './hooks/useFileManagement';
import { useFileUpload } from './hooks/useFileUpload';
import { useProgressMessages } from './hooks/useProgressMessages';
import { HistoryMessages } from './components/ProgressMessages/HistoryMessages';
import { ProgressBar } from './components/ProgressMessages/ProgressBar';
import { KnowledgeFileRecord } from '@/utils/file';

const KnowledgeScreen = () => {
    const {
        files,
        selectedFile,
        setSelectedFile,
        handleDeleteFile,
        loadFiles,
        handleToggleFile
    } = useFileManagement();

    const { handleFileUpload } = useFileUpload(loadFiles);
    const { 
        currentProgress, 
        historyMessages, 
        showHistory, 
        setShowHistory 
    } = useProgressMessages();
    const [confirmDelete, setConfirmDelete] = React.useState<{ 
        visible: boolean, 
        file?: KnowledgeFileRecord 
    }>({ visible: false });
    const [progressBarHeight, setProgressBarHeight] = React.useState(0);

    // 计算 HistoryMessages 的底部距离
    const historyBottomDistance = React.useMemo(() => {
        // 12(progress bar bottom) + progress bar height + 24(gap)
        return progressBarHeight + 48;
    }, [progressBarHeight]);

    return (
        <div className="flex h-full relative">
            <LeftPanelContainer>
                <FileList
                    files={files}
                    onFileSelect={setSelectedFile}
                    onFileUpload={handleFileUpload}
                    onDeleteFile={(file) => setConfirmDelete({ visible: true, file })}
                    onToggleFile={handleToggleFile}
                />
            </LeftPanelContainer>
            
            <div className="flex-1 border border-[hsla(var(--app-border))] rounded-lg">
                <VectorDBSearch />
            </div>

            <DeleteConfirmDialog
                isOpen={confirmDelete.visible}
                file={confirmDelete.file}
                onClose={() => setConfirmDelete({ visible: false })}
                onConfirm={(file) => {
                    handleDeleteFile(file.id);
                    setConfirmDelete({ visible: false });
                }}
            />

            <HistoryMessages 
                messages={historyMessages} 
                style={{ bottom: `${historyBottomDistance}px` }}
            />
            
            {currentProgress && (
                <ProgressBar 
                    progress={currentProgress}
                    showHistory={showHistory}
                    onToggleHistory={setShowHistory}
                    onHeightChange={setProgressBarHeight}
                />
            )}
        </div>
    );
};

export default KnowledgeScreen; 
