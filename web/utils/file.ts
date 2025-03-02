import { baseName } from '@janhq/core'
import Uppy from '@uppy/core'
import XHR from '@uppy/xhr-upload'

// 文件基本信息类型定义
export type FilePathWithSize = {
  path: string  // 文件路径
  name: string  // 文件名
  size: number  // 文件大小
}

// 扩展File接口，添加可选的path属性
export interface FileWithPath extends File {
  path?: string
}

// 知识库文件记录的类型定义
export interface KnowledgeFileRecord {
  id: string      // 文件唯一标识
  name: string    // 文件名
  size: number    // 文件大小
  createdAt: string  // 创建时间
  enabled: boolean   // 是否启用
}

// 知识库文件列表的类型定义
interface KnowledgeFileList {
  files: KnowledgeFileRecord[]
}

// localStorage中存储知识库文件列表的key
const KNOWLEDGE_FILE_LIST_KEY = 'knowledge_file_list'

/**
 * 从localStorage读取知识库文件列表
 */
export const readKnowledgeFileList = (): KnowledgeFileList => {
  try {
    const data = localStorage.getItem(KNOWLEDGE_FILE_LIST_KEY)
    return data ? JSON.parse(data) : { files: [] }
  } catch (error) {
    console.error('Error reading knowledge file list:', error)
    return { files: [] }
  }
}

/**
 * 将知识库文件列表保存到localStorage
 */
const saveKnowledgeFileList = (fileList: KnowledgeFileList) => {
  try {
    localStorage.setItem(KNOWLEDGE_FILE_LIST_KEY, JSON.stringify(fileList))
  } catch (error) {
    console.error('Error saving knowledge file list:', error)
  }
}

/**
 * 创建知识库专用的文件上传器
 * @returns Uppy实例，配置为知识库文件上传
 */
export const knowledgeUploader = () => {
  const uppy = new Uppy().use(XHR, {
    endpoint: `${API_BASE_URL}/v1/files`,
    method: 'POST',
    fieldName: 'file',
    formData: true,
    limit: 1,
  })
  
  // 设置上传元数据，标记为知识库文件
  uppy.setMeta({
    purpose: 'assistants',
  })
  
  // 上传成功后，将文件信息保存到知识库列表
  uppy.on('upload-success', async (file, response) => {
    if (response?.body?.id) {
      const fileList = await readKnowledgeFileList()
      fileList.files.push({
        id: response.body.id,
        name: response.body.filename,
        size: file?.size || 0,
        createdAt: new Date().toISOString(),
        enabled: true
      })
      await saveKnowledgeFileList(fileList)
    }
  })
  
  return uppy
}

/**
 * 获取知识库文件列表
 * @returns Promise<KnowledgeFileRecord[]> 知识库文件列表
 */
export const listKnowledgeFiles = async (): Promise<KnowledgeFileRecord[]> => {
  const fileList = await readKnowledgeFileList()
  return fileList.files
}

/**
 * 删除知识库文件
 * @param id 要删除的文件ID
 * @returns 删除操作的结果
 */
export const deleteKnowledgeFile = async (id: string) => {
  const result = await deleteFile(id)
  if (result) {
    const fileList = await readKnowledgeFileList()
    fileList.files = fileList.files.filter(file => file.id !== id)
    await saveKnowledgeFileList(fileList)
  }
  return result
}

/**
 * 更新知识库文件状态
 * @param id 文件ID
 * @param enabled 是否启用
 * @returns 更新是否成功
 */
export const updateKnowledgeFileStatus = async (id: string, enabled: boolean) => {
  const fileList = await readKnowledgeFileList()
  const fileIndex = fileList.files.findIndex(file => file.id === id)
  if (fileIndex !== -1) {
    fileList.files[fileIndex].enabled = enabled
    await saveKnowledgeFileList(fileList)
    return true
  }
  return false
}

/**
 * 从文件对象获取文件信息
 * @param files 文件对象数组
 * @returns Promise<FilePathWithSize[]> 文件信息数组
 */
export const getFileInfoFromFile = async (
  files: FileWithPath[]
): Promise<FilePathWithSize[]> => {
  const result: FilePathWithSize[] = []
  for (const file of files) {
    if (file.path && file.path.length > 0) {
      const fileName = await baseName(file.path)
      result.push({
        path: file.path,
        name: fileName,
        size: file.size,
      })
    }
  }
  return result
}

/**
 * 创建通用文件上传器实例
 * @returns Uppy实例，配置为助手文件上传
 */
export const uploader = () => {
  const uppy = new Uppy().use(XHR, {
    endpoint: `${API_BASE_URL}/v1/files`,
    method: 'POST',
    fieldName: 'file',
    formData: true,
    limit: 1,
  })
  uppy.setMeta({
    purpose: 'assistants',
  })
  return uppy
}

/**
 * 获取服务器上的文件信息
 * @param id 文件ID
 * @returns 文件信息
 */
export const getFileInfo = (id: string) => {
  return fetch(`${API_BASE_URL}/v1/files/${id}`)
    .then((e) => e.json())
    .catch(() => undefined)
}

/**
 * 获取服务器上的所有文件列表
 * @returns 所有文件的列表
 */
export const listAllFiles = () => {
  return fetch(`${API_BASE_URL}/v1/files`)
    .then((e) => e.json())
    .catch(() => undefined)
}

/**
 * 从服务器删除指定文件
 * @param id 要删除的文件ID
 * @returns 删除操作的响应
 */
export const deleteFile = (id: string) => {
  return fetch(`${API_BASE_URL}/v1/files/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
  })
    .then((response) => response.json())
    .catch(() => undefined)
}

/**
 * 获取文件内容
 * @param id 文件ID
 * @returns 文件内容的Promise
 */
export const getFileContent = (id: string) => {
  return fetch(`${API_BASE_URL}/v1/files/${id}/content`)
    .then((response) => response.text())
    .catch(() => undefined)
}
