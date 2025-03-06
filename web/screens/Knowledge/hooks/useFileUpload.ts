import { knowledgeUploader, deleteKnowledgeFile } from '@/utils/file'
import { ToolManager, KnowledgeParseRequest } from '@janhq/core'
import { events } from '@janhq/core'
import { FilterAgent } from '@/agents/FilterAgent';
import { BaseAgent } from '@/agents/BaseAgent';
import { ProgressMessage } from '../types/message';
import { Document } from '../types/document';


// 进度处理工具类
class ProgressHandler {
    constructor(private totalFiles: number) { }

    calculateUploadProgress(uploadProgress: number): number {
        // 上传占总进度的5%
        return Math.min(Math.round(uploadProgress * 0.05), 5);
    }

    calculateProcessProgress(fileIndex: number, currentFileProgress: number): number {
        // 处理占总进度的95%
        const progressPerFile = 95 / this.totalFiles;
        const completedFilesProgress = fileIndex * progressPerFile;
        const currentProgress = progressPerFile * (currentFileProgress / 100);
        // 加上上传的5%基础进度
        return Math.min(Math.round(5 + completedFilesProgress + currentProgress), 100);
    }

    emitProgress(event: ProgressMessage) {
        events.emit('knowledge:progress', event);
    }

    emitWithTimeout(event: ProgressMessage, timeout = 3000) {
        this.emitProgress(event);
        setTimeout(() => {
            // 先清除历史消息
            this.clearHistory();
            // 然后清除进度条
            this.emitProgress({
                value: 0,
                addToHistory: false,
                title: '',
                subtitle: '',
                content: ''
            });
        }, timeout);
    }

    clearHistory() {
        events.emit('knowledge:progress', {
            visible: false,
            value: 0,
            fileName: '',
            clearHistory: true
        });
    }
}

// 文档处理工具类
class DocumentProcessor {
    constructor(
        private progressHandler: ProgressHandler,
        private fileIndex: number,
        private totalFiles: number
    ) { }

    getProgressHandler(): ProgressHandler {
        return this.progressHandler;
    }

    async processWithAgent<T extends Document>(
        agent: BaseAgent<T, T>,
        chunks: T[],
    ) {
        const results: T[] = [];
        const totalChunks = chunks.length;

        for (let i = 0; i < totalChunks; i++) {
            const { result } = await agent.process(chunks[i], this.fileIndex, this.totalFiles);
            if (result) {
                results.push(result);
            }
        }

        return results;
    }
}

export const useFileUpload = (onSuccess: () => void) => {

    const parseDocument = async (vectorDBTool: any, file_id: string, file_name: string) => {
        const parseDocRequest: KnowledgeParseRequest = {
            file_id,
            file_name,
            chunk_size: 512,
            chunk_overlap: 128,
        };
        const response = await vectorDBTool.process({
            knowledge: {
                operation: 'parseDoc',
                parseDoc: { request: parseDocRequest }
            }
        });
        return response.knowledge?.parseDoc?.response;
    };

    const embedDocuments = async (vectorDBTool: any, docs: any[]) => {
        return await vectorDBTool.process({
            knowledge: {
                operation: 'embedDocs',
                embedDocs: {
                    request: {
                        docs,
                        model: 'bge-m3:567m'
                    }
                }
            }
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const uppy = knowledgeUploader();
        const progressHandler = new ProgressHandler(files.length);

        // 添加上传进度监听
        uppy.on('upload-progress', (file, progress) => {
            if (!file || !progress.bytesTotal) return;
        });

        files.forEach(file => uppy.addFile({
            name: file.name,
            type: file.type,
            data: file,
        }));

        try {
            const result = await uppy.upload();
            const successfulFiles = result?.successful || [];
            const totalFiles = successfulFiles.length;

            progressHandler.emitProgress({
                value: 50,
                title: `Documents all set! Embedding snippets into HNSW now – this will just take a moment. Thanks for your patience while we optimize everything for you! 🌟`,
                subtitle: `Detail`,
                content: `Total files is ${files.length}, successfully uploaded ${totalFiles} files`,
                addToHistory: false
            });

            if (!totalFiles) {
                throw new Error('🚨 No valid files to upload');
            }

            const vectorDBTool = ToolManager.instance().get('vectordb');

            if (!vectorDBTool) {
                throw new Error('🚨 VectorDB tool not found');
            }


            for (let fileIndex = 0; fileIndex < successfulFiles.length; fileIndex++) {
                const file = successfulFiles[fileIndex];
                const file_id = file.response?.body?.id;
                const file_name: string = file.response?.body?.filename ?? '';

                if (!file_name || !file_id) {
                    console.error('🚨 File information is incomplete');
                    continue;
                }

                try {
                    const docProcessor = new DocumentProcessor(progressHandler, fileIndex, totalFiles);

                    const documents = await parseDocument(vectorDBTool, file_id, file.name ?? '');
                    let processedDocs = documents;
                    console.log("当前文件", file.name, "分割后文档数量", processedDocs.length)

                    const filterAgent = new FilterAgent(
                        { fileIndex, totalFiles, chunkIndex: 0, totalChunks: processedDocs.length }
                    );

                    if (filterAgent.getAgentConfig().enabled) {
                        processedDocs = await docProcessor.processWithAgent(filterAgent, processedDocs);
                    }

                    await embedDocuments(vectorDBTool, processedDocs);

                    progressHandler.emitProgress({
                        value: 50 + Number((fileIndex / totalFiles * 50).toFixed(4)),
                        title: `Embedding...`,
                        subtitle: `${file_name}`,
                        content: `Total files is ${files.length}, successfully embedded ${fileIndex} files`,
                        addToHistory: false
                    });

                    onSuccess();
                } catch (error) {
                    await deleteKnowledgeFile(file_id);
                    console.warn('🚨 File processing failed:', error);
                    continue;
                }
            }

            progressHandler.clearHistory();
            progressHandler.emitWithTimeout({
                value: 100,
                title: `All documents are now neatly organized in the knowledge database — happy exploring! 🎉`,
                subtitle: `Detail`,
                content: `All documents processed (total ${totalFiles})`,
                addToHistory: false
            });

        } catch (error) {
            const progressHandler = new ProgressHandler(1);
            progressHandler.clearHistory();
            progressHandler.emitWithTimeout({
                value: 0,
                title: `🚨 File processing failed`,
                subtitle: `Detail`,
                content: `File processing failed`,
                addToHistory: true
            });
            console.error('🚨 File upload failed:', error);
        }
    };

    return { handleFileUpload };
};