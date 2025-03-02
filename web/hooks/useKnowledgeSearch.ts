import { useState } from 'react'
import { ToolManager, MessageRequest, KnowledgeQueryResponse } from '@janhq/core'
import { readKnowledgeFileList } from '@/utils/file'

/**
 * 知识库搜索结果的返回类型接口
 * @interface UseKnowledgeSearchReturn
 * @property {KnowledgeQueryResponse} results - 搜索结果数组
 * @property {boolean} isSearching - 是否正在搜索中
 * @property {(query: string, topK: number) => Promise<KnowledgeQueryResponse>} searchKnowledge - 执行搜索的函数
 */
interface UseKnowledgeSearchReturn {
  results: KnowledgeQueryResponse
  isSearching: boolean
  searchKnowledge: (query: string, topK: number) => Promise<KnowledgeQueryResponse>
}

/**
 * 知识库搜索 Hook
 * 
 * 该 Hook 提供了对知识库进行向量检索的功能，支持设置返回结果数量，并自动处理加载状态。
 * 
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const { results, isSearching, searchKnowledge } = useKnowledgeSearch();
 *   
 *   const handleSearch = () => {
 *     // 搜索前5条最相关的结果
 *     searchKnowledge("你的搜索关键词", 5);
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleSearch} disabled={isSearching}>
 *         搜索
 *       </button>
 *       {results.map(result => (
 *         <div key={result.id}>
 *           <p>{result.content.pageContent}</p>
 *           <p>相似度: {result.similarity}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {UseKnowledgeSearchReturn} 包含以下内容的对象:
 * - results: 搜索结果数组，每个结果包含内容和相似度分数
 * - isSearching: 布尔值，表示是否正在执行搜索
 * - searchKnowledge: 执行搜索的函数，接受查询文本和 topK 参数
 * 
 * @remarks
 * - 该 Hook 会自动从知识库文件列表中筛选出已启用的文件进行搜索
 * - 使用 bge-m3:567m 模型进行向量编码
 * - 搜索过程中会自动处理加载状态
 * - 如果查询文本为空，将不会执行搜索
 * - 搜索失败时会在控制台输出错误信息
 */
export const useKnowledgeSearch = (): UseKnowledgeSearchReturn => {
  const [results, setResults] = useState<KnowledgeQueryResponse>([])
  const [isSearching, setIsSearching] = useState(false)

  /**
   * 执行知识库搜索
   * @param {string} query - 搜索查询文本
   * @param {number} topK - 返回的最相似结果数量
   * @returns {Promise<KnowledgeQueryResult[]>} 返回搜索结果数组
   */
  const searchKnowledge = async (query: string, topK: number): Promise<KnowledgeQueryResponse> => {
    if (!query.trim()) return []

    setIsSearching(true)
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

        const searchResults = response.knowledge?.query?.response || []
        setResults(searchResults)
        return searchResults
      }
      return []
    } catch (error) {
      console.error('搜索失败:', error)
      return []
    } finally {
      setIsSearching(false)
    }
  }

  return {
    results,
    isSearching, 
    searchKnowledge
  }
} 