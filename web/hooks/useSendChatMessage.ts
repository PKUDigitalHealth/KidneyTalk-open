import { useEffect, useRef } from 'react'

import {
  ChatCompletionRole,
  MessageRequestType,
  ExtensionTypeEnum,
  Thread,
  ThreadMessage,
  Model,
  ConversationalExtension,
  EngineManager,
  ToolManager,
  ThreadAssistantInfo,
} from '@janhq/core'
import { extractInferenceParams, extractModelLoadParams } from '@janhq/core'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'

import { modelDropdownStateAtom } from '@/containers/ModelDropdown'
import {
  currentPromptAtom,
  editPromptAtom,
  fileUploadAtom,
} from '@/containers/Providers/Jotai'

import { compressImage, getBase64 } from '@/utils/base64'
import { MessageRequestBuilder } from '@/utils/messageRequestBuilder'

import { ThreadMessageBuilder } from '@/utils/threadMessageBuilder'

import { useActiveModel } from './useActiveModel'

import { extensionManager } from '@/extension/ExtensionManager'
import { activeAssistantAtom } from '@/helpers/atoms/Assistant.atom'
import {
  addNewMessageAtom,
  deleteMessageAtom,
  getCurrentChatMessagesAtom,
  tokenSpeedAtom,
} from '@/helpers/atoms/ChatMessage.atom'
import { selectedModelAtom } from '@/helpers/atoms/Model.atom'
import {
  activeThreadAtom,
  engineParamsUpdateAtom,
  getActiveThreadModelParamsAtom,
  isGeneratingResponseAtom,
  updateThreadAtom,
  updateThreadWaitingForResponseAtom,
} from '@/helpers/atoms/Thread.atom'

import { QueryRefinementAgent, DivergentThinkingAgent, RelevanceJudgementAgent } from '@/agents'
import { KnowledgeQueryResponse } from '@janhq/core'
export const reloadModelAtom = atom(false)

// 添加新的类型定义
interface RAGResult {
  context: string;
  docs: KnowledgeQueryResponse;
}

// 在文件顶部添加新的接口定义
export interface RAGHistoryQueue {
  items: Array<{
    threadId: string;
    docs: KnowledgeQueryResponse;
  }>;
  maxSize: number;
}

// 新增 RAG 处理函数
async function processRAG(message: string, currentMessages: ThreadMessage[], divergentNum: number, similarityThreshold: number): Promise<RAGResult> {
  /**
   * RAG流程
   * 1. 使用QueryRefinementAgent优化查询
   * 2. 使用DivergentThinkingAgent获取发散性知识
   * 3. 合并两次检索的知识结果
   * 4. 使用relevanceJudgementAgent判断候选文本块是否与Query相关
   * 5. 使用生成的答案作为上下文
   */

  const agentContext = {
    fileIndex: 0,
    totalFiles: 0,
    chunkIndex: 0,
    totalChunks: 0
  }

  // 1. 使用QueryRefinementAgent优化查询
  const queryRefineAgent = new QueryRefinementAgent(agentContext)
  const refinedResults = await queryRefineAgent.process({
    query: message,
    history: currentMessages,
    topK: 10
  })

  // 2. 使用DivergentThinkingAgent获取发散性知识
  const divergentAgent = new DivergentThinkingAgent(agentContext)
  const divergentResults = await divergentAgent.process({
    query: message,
    knowledge: refinedResults.result ?? [],
    divergentNum: divergentNum,
    topK: 2
  })

  // 3. 合并并去重两次检索的知识结果
  const combinedKnowledge = [...(refinedResults.result ?? [])];

  // 将发散性检索结果添加到合并结果中
  divergentResults.result?.forEach(result => {
    // 检查是否已存在相同的文档
    const exists = combinedKnowledge.some(
      existing => existing[0].pageContent === result[0].pageContent
    );

    if (!exists) {
      combinedKnowledge.push(result);
    }
  });

  // 根据阈值筛选
  let filteredKnowledge = combinedKnowledge.filter(doc => {
    return doc[1] <= similarityThreshold
  })

  // 5. 使用relevanceJudgementAgent判断候选文本块是否与Query相关
  const relevanceJudgementAgent = new RelevanceJudgementAgent(agentContext)

  for (const doc of filteredKnowledge) {
    const relevanceResults = await relevanceJudgementAgent.process({
      query: doc[0].metadata.dbquery,
      doc: doc[0],
    })
    doc[0].metadata.relevance = relevanceResults.result
  }

  filteredKnowledge = filteredKnowledge.filter(doc => {
    return doc[0].metadata.relevance !== ''
  })

  // 4. 生成上下文
  const context = filteredKnowledge.length > 0
    ? filteredKnowledge.map(doc => doc[0].pageContent).join('\n')
    : ''


  return {
    context,
    docs: filteredKnowledge
  }
}

// 在 processRAG 函数之前添加新的队列操作函数
function saveRAGResultToQueue(threadId: string, docs: KnowledgeQueryResponse) {
  const queueKey = 'ragResultsQueue'
  const defaultQueue: RAGHistoryQueue = {
    items: [],
    maxSize: 100
  }

  // 获取现有队列
  const existingQueueStr = localStorage.getItem(queueKey)
  const queue: RAGHistoryQueue = existingQueueStr
    ? JSON.parse(existingQueueStr)
    : defaultQueue

  // 检查是否已存在相同 threadId 的记录
  const existingIndex = queue.items.findIndex(item => item.threadId === threadId)
  if (existingIndex !== -1) {
    // 如果存在,更新该记录
    queue.items[existingIndex].docs = docs
  } else {
    // 如果不存在,添加新记录
    queue.items.push({ threadId, docs })

    // 如果超出最大限制,移除最早的记录
    if (queue.items.length > queue.maxSize) {
      queue.items.shift()
    }
  }

  // 保存更新后的队列
  localStorage.setItem(queueKey, JSON.stringify(queue))
}

// 新增构造最终prompt的函数
function constructFinalPrompt(
  message: string,
  knowledgeContext: string,
  hasExistingContext: boolean,
  existingContext?: string
): string {
  if (hasExistingContext && knowledgeContext) {
    return `请根据下面的相关知识和上下文回答用户问题，如果相关知识与用户问题不相关，则直接回复"找不到相关信息"。
----------------
相关知识：${knowledgeContext}
上下文：${existingContext}
----------------
问题: ${message}
----------------
有帮助的回答:`
  }

  if (!hasExistingContext && knowledgeContext) {
    return `
资料
---
${knowledgeContext}
---
    
请基于上面的知识回答下面的问题，要求尽可能全面、细致地回答。

问题: ${message}
`
  }

  return message
}

export default function useSendChatMessage() {
  const activeThread = useAtomValue(activeThreadAtom)
  const activeAssistant = useAtomValue(activeAssistantAtom)
  const addNewMessage = useSetAtom(addNewMessageAtom)
  const updateThread = useSetAtom(updateThreadAtom)
  const updateThreadWaiting = useSetAtom(updateThreadWaitingForResponseAtom)
  const setCurrentPrompt = useSetAtom(currentPromptAtom)
  const deleteMessage = useSetAtom(deleteMessageAtom)
  const setEditPrompt = useSetAtom(editPromptAtom)

  const currentMessages = useAtomValue(getCurrentChatMessagesAtom)
  const selectedModel = useAtomValue(selectedModelAtom)
  const { activeModel, startModel } = useActiveModel()

  const modelRef = useRef<Model | undefined>()
  const activeModelParams = useAtomValue(getActiveThreadModelParamsAtom)
  const engineParamsUpdate = useAtomValue(engineParamsUpdateAtom)

  const setEngineParamsUpdate = useSetAtom(engineParamsUpdateAtom)
  const setReloadModel = useSetAtom(reloadModelAtom)
  const [fileUpload, setFileUpload] = useAtom(fileUploadAtom)
  const setIsGeneratingResponse = useSetAtom(isGeneratingResponseAtom)
  const activeThreadRef = useRef<Thread | undefined>()
  const activeAssistantRef = useRef<ThreadAssistantInfo | undefined>()
  const setTokenSpeed = useSetAtom(tokenSpeedAtom)
  const setModelDropdownState = useSetAtom(modelDropdownStateAtom)

  const selectedModelRef = useRef<Model | undefined>()

  useEffect(() => {
    modelRef.current = activeModel
  }, [activeModel])

  useEffect(() => {
    activeThreadRef.current = activeThread
  }, [activeThread])

  useEffect(() => {
    selectedModelRef.current = selectedModel
  }, [selectedModel])

  useEffect(() => {
    activeAssistantRef.current = activeAssistant
  }, [activeAssistant])

  const resendChatMessage = async () => {
    // Delete last response before regenerating
    const newConvoData = Array.from(currentMessages)
    let toSendMessage = newConvoData.pop()

    while (toSendMessage && toSendMessage?.role !== ChatCompletionRole.User) {
      await extensionManager
        .get<ConversationalExtension>(ExtensionTypeEnum.Conversational)
        ?.deleteMessage(toSendMessage.thread_id as string, toSendMessage.id)
        .catch(console.error)
      deleteMessage(toSendMessage.id ?? '')
      toSendMessage = newConvoData.pop()
    }

    if (toSendMessage?.content[0]?.text?.value)
      sendChatMessage(toSendMessage.content[0].text.value, true)
  }

  const sendChatMessage = async (
    message: string,
    isResend: boolean = false,
    messages?: ThreadMessage[]
  ) => {
    if (!message || message.trim().length === 0) return

    if (!activeThreadRef.current || !activeAssistantRef.current) {
      console.error('No active thread or assistant')
      return
    }

    if (selectedModelRef.current?.id === undefined) {
      setModelDropdownState(true)
      return
    }

    if (engineParamsUpdate) setReloadModel(true)
    setTokenSpeed(undefined)

    const runtimeParams = extractInferenceParams(activeModelParams)
    const settingParams = extractModelLoadParams(activeModelParams)

    updateThreadWaiting(activeThreadRef.current.id, true)
    setCurrentPrompt('')
    setEditPrompt('')

    let base64Blob = fileUpload ? await getBase64(fileUpload.file) : undefined

    if (base64Blob && fileUpload?.type === 'image') {
      // Compress image
      base64Blob = await compressImage(base64Blob, 512)
    }

    const modelRequest =
      selectedModelRef.current ?? activeAssistantRef.current?.model

    // Fallback support for previous broken threads
    if (activeAssistantRef.current?.model?.id === '*') {
      activeAssistantRef.current.model = {
        id: modelRequest.id,
        settings: modelRequest.settings,
        parameters: modelRequest.parameters,
      }
    }
    if (runtimeParams.stream == null) {
      runtimeParams.stream = true
    }

    // Build Message Request
    const requestBuilder = new MessageRequestBuilder(
      MessageRequestType.Thread,
      {
        ...modelRequest,
        settings: settingParams,
        parameters: runtimeParams,
      },
      activeThreadRef.current,
      messages ?? currentMessages
    ).addSystemMessage(activeAssistantRef.current?.instructions)

    if (!isResend) {
      // 在UI中显示原始消息
      requestBuilder.pushMessage(message, base64Blob, fileUpload)

      // Build Thread Message to persist
      const threadMessageBuilder = new ThreadMessageBuilder(
        requestBuilder
      ).pushMessage(message, base64Blob, fileUpload)

      const newMessage = threadMessageBuilder.build()

      // Update thread state
      const updatedThread: Thread = {
        ...activeThreadRef.current,
        updated: newMessage.created_at,
        metadata: {
          ...activeThreadRef.current.metadata,
          lastMessage: message, // 使用原始消息而不是增强后的prompt
        },
      }
      updateThread(updatedThread)

      // Add message
      const createdMessage = await extensionManager
        .get<ConversationalExtension>(ExtensionTypeEnum.Conversational)
        ?.createMessage(newMessage)
        .catch(() => undefined)

      if (!createdMessage) return

      // Push to states
      addNewMessage(createdMessage)
    }

    // Start Model if not started
    const modelId =
      selectedModelRef.current?.id ?? activeAssistantRef.current?.model.id

    if (base64Blob) {
      setFileUpload(undefined)
    }

    if (modelRef.current?.id !== modelId && modelId) {
      const error = await startModel(modelId).catch((error: Error) => error)
      if (error) {
        updateThreadWaiting(activeThreadRef.current.id, false)
        return
      }
    }
    setIsGeneratingResponse(true)

    // Process message request with Assistants tools
    const request = await ToolManager.instance().process(
      requestBuilder.build(),
      activeAssistantRef?.current.tools ?? []
    )

    // 修改 hasContext 的判断，确保返回布尔值
    const hasContext = Boolean(request.messages?.some(msg =>
      (msg.content as string).includes('<上下文>: ')
    ))

    // 处理RAG逻辑
    let retrievalContext = ''
    let retrievalDocs = null
    const ifEnableRAG = localStorage.getItem('ifEnableRAG') === 'true'
    if (ifEnableRAG) {
      const ragResult = await processRAG(message, currentMessages, 3, 0.4)
      retrievalContext = ragResult.context
      retrievalDocs = ragResult.docs

      // 使用新的队列存储方式
      if (activeThreadRef.current?.id) {
        saveRAGResultToQueue(activeThreadRef.current.id, retrievalDocs)
      }
    }

    const finalMessage = constructFinalPrompt(
      message,
      retrievalContext,
      hasContext,  // 现在一定是 boolean 类型
      retrievalContext as string
    )

    // Request for inference
    EngineManager.instance()
      .get(requestBuilder.model?.engine ?? modelRequest.engine ?? '')
      ?.inference({
        ...request,
        messages: [
          ...request.messages?.slice(0, -1) ?? [],
          {
            role: ChatCompletionRole.User,
            content: finalMessage,
          }
        ],
      })

    // Reset states
    setReloadModel(false)
    setEngineParamsUpdate(false)
  }

  return {
    sendChatMessage,
    resendChatMessage,
  }
}
