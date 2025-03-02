import path from 'path'
import { getJanDataFolderPath } from '@janhq/core/node'
import {
  KnowledgeParseRequest,
  KnowledgeParseResponse,
  KnowledgeEmbedRequest,
  KnowledgeEmbedResponse,
  KnowledgeQueryRequest,
  KnowledgeQueryResponse
} from '@janhq/core'
import { retrieval } from './retrieval'
import { vectorDB } from './vectordb'



export function toolRetrievalUpdateTextSplitter(
  chunkSize: number,
  chunkOverlap: number
) {
  retrieval.updateTextSplitter(chunkSize, chunkOverlap)
}

export async function toolRetrievalIngestNewDocument(
  thread: string,
  file: string,
  model: string,
  engine: string,
  useTimeWeighted: boolean
) {
  const threadPath = path.join(getJanDataFolderPath(), 'threads', thread)
  const filePath = path.join(getJanDataFolderPath(), 'files', file)
  retrieval.updateEmbeddingEngine(model, engine)
  return retrieval
    .ingestAgentKnowledge(filePath, `${threadPath}/memory`, useTimeWeighted)
    .catch((err) => {
      console.error(err)
    })
}

export async function toolRetrievalLoadThreadMemory(threadId: string) {
  return retrieval
    .loadRetrievalAgent(
      path.join(getJanDataFolderPath(), 'threads', threadId, 'memory')
    )
    .catch((err) => {
      console.error(err)
    })
}

export async function toolRetrievalQueryResult(
  query: string,
  useTimeWeighted: boolean = false
) {
  return retrieval.generateResult(query, useTimeWeighted).catch((err) => {
    console.error(err)
  })
}

// 知识管理的向量数据库相关工具

export async function toolVectorDBParseSplitter(
  request: KnowledgeParseRequest
) {
  // 获取文件路径
  const filePath = path.join(getJanDataFolderPath(), 'files', request.file_name)

  return vectorDB
    .parseDoc(filePath, request.file_id, request.chunk_size, request.chunk_overlap)
    .catch((err) => {
      console.error('向量数据库解析分割器失败', err)
    })
}

export async function toolVectorDBEmbedDocuments(
  request: KnowledgeEmbedRequest
) {
  return vectorDB
    .embedDocuments(request.docs)
    .catch((err) => {
      console.error('向量数据库嵌入文档失败', err)
    })
}

export async function toolVectorDBQuery(request: KnowledgeQueryRequest) {
  vectorDB.updateEmbeddingEngine(request.model)
  return vectorDB
    .query(request.query, request.topK, request.enabledFilesIds, request.metric, request.model)
    .catch((err) => {
      console.error(err)
    })
}
