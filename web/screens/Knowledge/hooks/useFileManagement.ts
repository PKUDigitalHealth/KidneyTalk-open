import { useState, useEffect } from 'react'
import { 
  listKnowledgeFiles, 
  deleteKnowledgeFile, 
  updateKnowledgeFileStatus,
  KnowledgeFileRecord 
} from '@/utils/file'

export const useFileManagement = () => {
  const [files, setFiles] = useState<KnowledgeFileRecord[]>([])
  const [selectedFile, setSelectedFile] = useState<KnowledgeFileRecord | null>(null)

  const loadFiles = async () => {
    const files = await listKnowledgeFiles()
    setFiles(files)
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const handleDeleteFile = async (id: string) => {
    await deleteKnowledgeFile(id)
    loadFiles()
  }

  const handleToggleFile = async (id: string) => {
    const file = files.find(f => f.id === id)
    if (file) {
      await updateKnowledgeFileStatus(id, !file.enabled)
      loadFiles()
    }
  }

  return {
    files,
    selectedFile,
    setSelectedFile,
    handleDeleteFile,
    loadFiles,
    handleToggleFile
  }
} 