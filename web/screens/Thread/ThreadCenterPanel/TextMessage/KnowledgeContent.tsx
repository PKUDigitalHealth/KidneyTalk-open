import React, { useState } from 'react'
import { Switch } from '@janhq/joi'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'

import { RAGHistoryQueue } from '@/hooks/useSendChatMessage'

type KnowledgeItem = [
  {
    pageContent: string
    metadata: Record<string, any>  // 使用更宽松的类型定义
  },
  number
]

export const getLastRAGResults = (threadId: string) => {
  const queueKey = 'ragResultsQueue'
  try {
    const queueStr = localStorage.getItem(queueKey)
    if (!queueStr) return []

    const queue: RAGHistoryQueue = JSON.parse(queueStr)
    
    // 查找对应 threadId 的记录
    const threadRecord = queue.items.find(item => item.threadId === threadId)
    return threadRecord?.docs || []
  } catch {
    return []
  }
}

const KnowledgeContent: React.FC<{ threadId: string }> = ({ threadId }) => {
  const [expandedItems, setExpandedItems] = useState<{[key: number]: boolean}>({})

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  // 使用传入的 threadId 获取结果
  const results = getLastRAGResults(threadId) as KnowledgeItem[]
  
  const formatSourceName = (source: string) => {
    return source?.split('/')?.pop()?.replace(/\.[^/.]+$/, '') || ''
  }
  
  return (
    <div className="flex flex-col gap-4">
      {results.map((item: KnowledgeItem, index) => (
        <div 
          key={index}
          className="rounded-lg border border-[hsla(var(--border))] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="text-sm font-medium">
                Source: {formatSourceName(item[0]?.metadata?.source)}
              </div>
              <div className="flex gap-4">
                <div className="text-xs text-[hsla(var(--text-secondary))]">
                  Distance Score: {(item[1]).toFixed(3)}
                </div>
                <div className="text-xs text-[hsla(var(--text-secondary))]">
                  Lines: {item[0]?.metadata?.loc?.lines?.from}-{item[0]?.metadata?.loc?.lines?.to}
                </div>
              </div>
              <div className="mt-1 text-xs text-[hsla(var(--text-secondary))]">
                {item[0]?.metadata?.dbquery}
              </div>
              <div className="mt-1 text-xs text-[hsla(var(--text-secondary))]">
                {item[0]?.metadata?.relevance}
              </div>
            </div>
            <Switch
              checked={expandedItems[index]}
              onChange={() => toggleExpand(index)}
            />
          </div>
          
          {expandedItems[index] && (
            <div className="mt-4 rounded bg-[hsla(var(--background-tertiary))] p-4">
              <Markdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[
                  [rehypeKatex, { throwOnError: false }]
                ]}
              >
                {item[0]?.pageContent}
              </Markdown>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default KnowledgeContent 