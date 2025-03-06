import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { DocxLoader } from "langchain/document_loaders/fs/docx"
import { DocumentLoader } from 'langchain/document_loaders/base'
import { HNSWLib } from 'langchain/vectorstores/hnswlib'
import { OllamaEmbeddings } from 'langchain/embeddings/ollama'
import { Ollama } from 'langchain/llms/ollama'
import { getJanDataFolderPath } from '@janhq/core/node'
import path from 'path'
import fs from 'fs'
import { Document } from 'langchain/document'
import {
    KnowledgeParseResponse,
    KnowledgeEmbedResponse,
    KnowledgeQueryResponse
} from '@janhq/core'

export class VectorDB {
    private static readonly VECTOR_DB_PATH = path.join(getJanDataFolderPath(), 'KnowledgeVectorDB')
    private vectorStore: HNSWLib | null = null
    private embeddings: OllamaEmbeddings
    private textSplitter: RecursiveCharacterTextSplitter
    private llm: Ollama

    // 初始化向量库
    constructor(chunkSize: number = 512, chunkOverlap: number = 128) {
        this.embeddings = new OllamaEmbeddings(
            { model: 'bge-m3:567m' },
        )

        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize,
            chunkOverlap,
        })

        this.llm = new Ollama({
            model: 'qwen2.5:7b'
        })

        this.initVectorStore().catch(error => {
            console.error('初始化向量库失败，将在首次使用时创建:', error);
        });
    }

    private async initVectorStore(): Promise<void> {
        try {
            // 检查向量库是否存在
            const exists = await fs.promises.access(VectorDB.VECTOR_DB_PATH)
                .then(() => true)
                .catch(() => false);

            // 如果向量库存在，则加载向量库
            if (exists) {
                this.vectorStore = await HNSWLib.load(
                    VectorDB.VECTOR_DB_PATH,
                    this.embeddings
                );
            } else {
                console.warn('未找到现有向量库，将在首次使用时创建');
            }
        } catch (error) {
            console.error('初始化向量库时出错:', error);
            throw error;
        }
    }

    public updateEmbeddingEngine(model?: string): void {
        console.log('更新嵌入模型:', model ?? 'bge-m3:567m')
        this.embeddings = new OllamaEmbeddings(
            { model: model ?? 'bge-m3:567m' },
        )
    }


    /**
     * 解析并分割PDF文件
     * @param filePath 文件路径
     * @param fileId 文件ID
     * @param chunkSize 分割块大小
     * @param chunkOverlap 分割块重叠
     * @returns 分割后的文档
     */
    async parseDoc(
        filePath: string,
        fileId: string,
        chunkSize: number,
        chunkOverlap: number
    ): Promise<KnowledgeParseResponse> {
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize,
            chunkOverlap,
        })

        let loader: DocumentLoader
        const isPDF = filePath.endsWith('.pdf')
        if (isPDF) {
            loader = new PDFLoader(filePath, {
                splitPages: true,
            })
        } else if (filePath.endsWith('.md')) {
            loader = new TextLoader(filePath)
        } else if (filePath.endsWith('.txt')) {
            loader = new TextLoader(filePath)
        } else if (filePath.endsWith('.docx')) {
            loader = new DocxLoader(filePath)
        } else {
            throw new Error('不支持的文件类型。支持的格式: PDF, MD, TXT, DOCX')
        }

        const doc = await loader.load()

        // 在分割文档前，为每个文档添加 fileId
        doc.forEach(document => {
            document.metadata.fileId = fileId
        })

        const docs = await this.textSplitter.splitDocuments(doc)

        // 过滤掉内容太短或空白的文档，对PDF文档去除换行符
        const filteredDocs = docs.filter(doc => {
            let content = doc.pageContent.trim()
            if (isPDF) {
                content = content.replace(/\n/g, ' ').replace(/\s+/g, ' ')
                doc.pageContent = content
            }
            return content.length >= 10 && content !== ''
        })

        return filteredDocs
    }

    /**
     * 嵌入文档
     * @param docs 文档
     * @returns 是否成功
     */
    async embedDocuments(
        docs: Document[],
        model?: string
    ): Promise<KnowledgeEmbedResponse> {
        try {
            if (model) {
                this.updateEmbeddingEngine(model)
            }
            if (this.vectorStore) {
                await this.vectorStore.addDocuments(docs);
            } else {
                this.vectorStore = await HNSWLib.fromDocuments(docs, this.embeddings);
            }
            await this.vectorStore.save(VectorDB.VECTOR_DB_PATH)
            return true
        } catch (error) {
            console.error('嵌入文档时出错:', error)
            return false
        }
    }

    /**
     * 查询文档
     * @param query 查询文本
     * @param topK 返回的文档数量
     * @param enabledFilesIds 过滤的文件ID
     * @param metric 相似度度量
     * @param model 嵌入模型
     * @returns 查询结果
     */
    async query(
        query: string,
        topK: number = 2,
        enabledFilesIds: string[] = [],
        metric?: string,
        model?: string
    ): Promise<KnowledgeQueryResponse> {
        try {

            if (metric) {
                console.log('更新相似度度量:', metric)
            }

            if (model) {
                this.updateEmbeddingEngine(model)
            }

            if (!this.vectorStore) {
                if (!this.embeddings) {
                    throw new Error('Embedding model not initialized');
                }
                try {
                    this.vectorStore = await HNSWLib.load(
                        VectorDB.VECTOR_DB_PATH,
                        this.embeddings
                    );
                } catch (error) {
                    console.error('加载向量存储失败:', error);
                    return [];
                }
            }

            try {
                // 定义过滤函数，只返回 fileId 在 enabledFilesIds 中的文档
                const filter = enabledFilesIds.length > 0
                    ? (doc: Document) => enabledFilesIds.includes(doc.metadata.fileId)
                    : undefined;

                const results = await this.vectorStore.similaritySearchWithScore(
                    query,
                    topK,
                    filter
                );

                if (results.length === 0) {
                    return [];
                }

                return results
            } catch (error) {
                console.error('执行相似度搜索失败:', error);
                return [];
            }
        } catch (error) {
            console.error('查询时出错:', error);
            return [];
        }
    }
}

export const vectorDB = new VectorDB() 