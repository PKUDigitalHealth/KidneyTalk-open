import { ToolManager, MessageRequest, KnowledgeQueryResponse } from '@janhq/core'
import { readKnowledgeFileList } from '@/utils/file'

/**
 * 执行知识库搜索的工具函数
 * 
 * @param query - 搜索查询文本
 * @param topK - 返回的最相似结果数量
 * @returns 返回搜索结果数组
 */
export const searchKnowledge = async (
  query: string,
  topK: number
): Promise<KnowledgeQueryResponse> => {
  if (!query.trim()) return []

  try {
    const vectorDBTool = ToolManager.instance().get('vectordb')
    if (vectorDBTool) {
      const fileList = readKnowledgeFileList()
      const enabledFiles: string[] = fileList.files
        .filter(file => file.enabled)
        .map(file => file.id)

      if (enabledFiles.length === 0) {
        return []
      }

      const request: MessageRequest = {
        knowledge: {
          operation: 'query',
          query: {
            request: {
              query: query,
              topK: topK,
              enabledFilesIds: enabledFiles,
              model: 'bge-m3:567m'
            }
          }
        }
      }

      const response: MessageRequest = await vectorDBTool.process(request)
      return response.knowledge?.query?.response || []
    }
    return []
  } catch (error) {
    console.error('搜索失败:', error)
    return []
  }
} 