import React, { Fragment, useState, useEffect } from 'react'
import { Button, Input, Progress, ScrollArea, Tooltip } from '@janhq/joi'
import { useClickOutside } from '@janhq/joi'
import { useAtomValue, useSetAtom } from 'jotai'
import { DownloadCloudIcon, Trash2Icon, StarIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import CenterPanelContainer from '@/containers/CenterPanelContainer'
import { modelDownloadStateAtom } from '@/hooks/useDownloadState'
import { formatDownloadPercentage, toGibibytes } from '@/utils/converter'
import {
  isLocalEngine,
} from '@/utils/modelEngine'

import {
  configuredModelsAtom,
  getDownloadingModelAtom,
} from '@/helpers/atoms/Model.atom'

import { listLocalModels, LocalModel, pullModel, deleteModel } from '@/utils/ollama'

type Props = {
  isShowStarterScreen?: boolean
}

const DEFAULT_MODELS = [
  {
    name: 'deepseek-r1:latest',
    displayName: 'deepseek-r1:latest',
  },
  {
    name: 'qwen2.5:0.5b', // TODO 调试完成后需要改为3b的模型
    displayName: 'qwen2.5:0.5b',
  },
  {
    name: 'bge-m3:567m',
    displayName: 'bge-m3:567M',
  },
] as const

const getDefaultModelStatus = (modelName: string, localModels: LocalModel[]) => {
  const isDownloaded = localModels.some(model => model.name === modelName)
  return {
    isDownloaded,
    model: localModels.find(model => model.name === modelName)
  }
}

const OnDeviceStarterScreen = ({ isShowStarterScreen }: Props) => {
  const [searchValue, setSearchValue] = useState('')
  const [isOpen, setIsOpen] = useState(Boolean(searchValue.length))
  const [isOllamaInstalled, setIsOllamaInstalled] = useState(false)
  const downloadingModels = useAtomValue(getDownloadingModelAtom)
  const downloadStates = useAtomValue(modelDownloadStateAtom)

  const configuredModels = useAtomValue(configuredModelsAtom)

  const [localModels, setLocalModels] = useState<LocalModel[]>([])

  const [downloadProgress, setDownloadProgress] = useState<{
    modelName: string
    status: string
    progress?: number
  } | null>(null)

  useEffect(() => {
    const checkOllamaInstallation = async () => {
      try {
        const models = await listLocalModels()
        setIsOllamaInstalled(true)
        setLocalModels(models)
      } catch (error) {
        setIsOllamaInstalled(false)
        setLocalModels([])
      }
    }
    
    checkOllamaInstallation()
    const interval = setInterval(checkOllamaInstallation, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const remoteModel = configuredModels.filter((x) => !isLocalEngine(x.engine))

  const remoteModelEngine = remoteModel.map((x) => x.engine)

  const groupByEngine = remoteModelEngine.filter(function (item, index) {
    if (remoteModelEngine.indexOf(item) === index) return item
  })

  const itemsPerRow = 5

  const getRows = (array: string[], itemsPerRow: number) => {
    const rows = []
    for (let i = 0; i < array.length; i += itemsPerRow) {
      rows.push(array.slice(i, i + itemsPerRow))
    }
    return rows
  }

  const rows = getRows(
    groupByEngine.sort((a, b) => a.localeCompare(b)),
    itemsPerRow
  )

  const refDropdown = useClickOutside(() => setIsOpen(false))

  // 添加一个辅助函数来检查是否所有默认模型都已下载
  const areAllDefaultModelsDownloaded = (localModels: LocalModel[]) => {
    return DEFAULT_MODELS.every(defaultModel => 
      localModels.some(model => model.name === defaultModel.name)
    )
  }

  // 修改批量下载处理函数
  const handleBatchDownload = async () => {
    // 获取未下载的默认模型
    const undownloadedModels = DEFAULT_MODELS.filter(defaultModel => 
      !localModels.some(model => model.name === defaultModel.name)
    )

    // 逐个下载模型
    for (const defaultModel of undownloadedModels) {
      try {
        setDownloadProgress({ 
          modelName: defaultModel.name, 
          status: 'starting' 
        })
        
        await pullModel(defaultModel.name, {
          onProgress: (response) => {
            if (response.status === 'success') {
              setDownloadProgress(null)
              listLocalModels().then(setLocalModels)
            } else if (response.total && response.completed) {
              setDownloadProgress({
                modelName: defaultModel.name,
                status: response.status,
                progress: (response.completed / response.total) * 100
              })
            } else {
              setDownloadProgress({
                modelName: defaultModel.name,
                status: response.status
              })
            }
          }
        })
      } catch (error) {
        alert(`Failed to download ${defaultModel.name}`)
        setDownloadProgress(null)
      }
    }
  }

  return (
    <CenterPanelContainer isShowStarterScreen={isShowStarterScreen}>
      <ScrollArea className="flex h-full w-full items-center">
        <div className="relative mt-4 flex h-full w-full flex-col items-center justify-center">
          <div className="mx-auto flex h-full w-3/4 flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center gap-2">
              {isOllamaInstalled ? (
                <Tooltip
                  trigger={
                    <CheckCircle2Icon size={18} className="text-green-500" />
                  }
                  content={
                    <span className="text-sm">Ollama is installed and running!</span>
                  }
                />
              ) : (
                <Tooltip
                  trigger={
                    <a
                      href="https://ollama.com/download"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <XCircleIcon size={18} className="text-red-500 cursor-pointer" />
                    </a>
                  }
                  content={
                    <span className="text-sm">
                      Ollama service not detected. No worries - please restart the Ollama program and KidneyTalk-open, or click this icon to download Ollama
                    </span>
                  }
                />
              )}
              <Tooltip
                trigger={
                  <a
                    href="https://ollama.com/search"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium hover:underline"
                  >
                    Model Hub
                  </a>
                }
                content={
                  <span className="text-sm">Click to view all available Ollama models</span>
                }
              />
            </div>
            <div className="mt-6 w-[360px] md:w-[400px]">
              <Fragment>
                <div className="relative" ref={refDropdown}>
                  <div className="flex gap-2 ">
                    <Input
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value)
                      }}
                      placeholder="like: qwen2.5:7B"
                      prefixIcon={<DownloadCloudIcon size={16} />}
                      className="flex-1 w-[220px] md:w-[310px]"
                      disabled={!isOllamaInstalled}
                    />
                    <Button
                      theme="primary"
                      size='small'
                      disabled={!isOllamaInstalled || !searchValue.trim() || downloadProgress !== null}
                      onClick={() => {
                        const modelName = searchValue.trim()
                        setDownloadProgress({ modelName, status: 'starting' })
                        
                        pullModel(modelName, {
                          onProgress: (response) => {
                            if (response.status === 'success') {
                              setDownloadProgress(null)
                              setSearchValue('')
                              listLocalModels().then(setLocalModels)
                            } else if (response.total && response.completed) {
                              setDownloadProgress({
                                modelName,
                                status: response.status,
                                progress: (response.completed / response.total) * 100
                              })
                            } else {
                              setDownloadProgress({
                                modelName,
                                status: response.status
                              })
                            }
                          }
                        }).catch(() => {
                          setDownloadProgress(null)
                          alert('Download failed, please check if the model name is correct')
                        })
                      }}
                    >
                      <DownloadCloudIcon size={16} />
                    </Button>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <h2 className="text-[hsla(var(--text-secondary))]">
                    Available Models
                  </h2>
                  {isOllamaInstalled && (
                    <div className="flex items-center gap-2">
                      <Tooltip
                        trigger={
                          <Button
                            theme="primary"
                            size='small'
                            disabled={areAllDefaultModelsDownloaded(localModels) || downloadProgress !== null}
                            onClick={handleBatchDownload}
                            className="text-sm"
                          >
                            {areAllDefaultModelsDownloaded(localModels) 
                              ? "Done"
                              : "Get Default Models"}
                          </Button>
                        }
                        content={
                          <span className="text-sm">
                            {areAllDefaultModelsDownloaded(localModels) 
                              ? "All default models have been downloaded"
                              : "Download all missing default models"}
                          </span>
                        }
                      />
                    </div>
                  )}
                </div>

                {DEFAULT_MODELS.map((defaultModel) => {
                  const { isDownloaded, model } = getDefaultModelStatus(defaultModel.name, localModels)
                  const isDownloading = downloadProgress?.modelName === defaultModel.name
                  
                  return (
                    <div
                      key={defaultModel.name}
                      className="my-2 flex items-start justify-between gap-2 border-b border-[hsla(var(--app-border))] pb-4 pt-1"
                    >
                      <div className="w-full text-left">
                        <h6 className="mt-1.5 font-medium flex items-center gap-2">
                          {defaultModel.displayName}
                          <Tooltip
                            trigger={
                              <StarIcon size={16} className="text-yellow-500 cursor-help" />
                            }
                            content={
                              <span className="text-sm">This is a default model. All default models must be downloaded before starting a Chat</span>
                            }
                          />
                        </h6>
                        {isDownloaded && model && (
                          <div className="mt-1 flex items-center gap-2 text-sm text-[hsla(var(--text-secondary))]">
                            <span>{model.details.parameter_size}</span>
                            <span>•</span>
                            <span>{model.details.format}</span>
                            {model.details.quantization_level && (
                              <>
                                <span>•</span>
                                <span>{model.details.quantization_level}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {isDownloading ? (
                        <div className="flex w-full flex-col items-end gap-2">
                          <div className="mt-1.5 flex w-full items-center gap-2">
                            <Progress
                              className="flex-1"
                              value={downloadProgress?.progress || 0}
                            />
                            <div className="flex items-center justify-between gap-x-2">
                              <div className="flex gap-x-2">
                                <span className="min-w-[4rem] text-right text-sm">
                                  {downloadProgress?.progress?.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-[hsla(var(--text-secondary))]">
                            {downloadProgress?.status === 'starting' && 'Preparing download...'}
                            {downloadProgress?.status === 'pulling manifest' && 'Getting model info...'}
                            {downloadProgress?.status === 'downloading' && 'Downloading...'}
                            {downloadProgress?.status === 'verifying sha256 digest' && 'Verifying file...'}
                            {downloadProgress?.status === 'writing manifest' && 'Writing file...'}
                          </span>
                          {model && (
                            <span className="text-[hsla(var(--text-secondary))]">
                              {toGibibytes(model.size)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-end justify-end gap-2">
                          <div className="flex items-center gap-2">
                            {isDownloaded && (
                              <Button
                                theme="ghost"
                                className="!bg-[hsla(var(--danger-bg))]"
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete model ${defaultModel.name}?`)) {
                                    const success = await deleteModel(defaultModel.name)
                                    if (success) {
                                      const models = await listLocalModels()
                                      setLocalModels(models)
                                    } else {
                                      alert('Failed to delete model')
                                    }
                                  }
                                }}
                              >
                                <Trash2Icon size={16} />
                              </Button>
                            )}
                            {!isDownloaded && (
                              <Button
                                theme="ghost"
                                size='small'
                                className="!bg-[hsla(var(--secondary-bg))]"
                                disabled={!isOllamaInstalled}
                                onClick={() => {
                                  setDownloadProgress({ 
                                    modelName: defaultModel.name, 
                                    status: 'starting' 
                                  })
                                  
                                  pullModel(defaultModel.name, {
                                    onProgress: (response) => {
                                      if (response.status === 'success') {
                                        setDownloadProgress(null)
                                        listLocalModels().then(setLocalModels)
                                      } else if (response.total && response.completed) {
                                        setDownloadProgress({
                                          modelName: defaultModel.name,
                                          status: response.status,
                                          progress: (response.completed / response.total) * 100
                                        })
                                      } else {
                                        setDownloadProgress({
                                          modelName: defaultModel.name,
                                          status: response.status
                                        })
                                      }
                                    }
                                  }).catch(() => {
                                    setDownloadProgress(null)
                                    alert('Download failed, please check if the model name is correct')
                                  })
                                }}
                              >
                                <DownloadCloudIcon size={16} />
                              </Button>
                            )}
                          </div>
                          {model && (
                            <span className="text-[hsla(var(--text-secondary))]">
                              {toGibibytes(model.size)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {localModels
                  .filter(model => !DEFAULT_MODELS.some(defaultModel => defaultModel.name === model.name))
                  .map((model) => {
                    const isDownloading = downloadingModels.some(
                      (md) => md === model.name
                    )
                    return (
                      <div
                        key={model.name}
                        className="my-2 flex items-start justify-between gap-2 border-b border-[hsla(var(--app-border))] pb-4 pt-1 last:border-none"
                      >
                        <div className="w-full text-left">
                          <h6 className="mt-1.5 font-medium">{model.name}</h6>
                          <div className="mt-1 flex items-center gap-2 text-sm text-[hsla(var(--text-secondary))]">
                            <span>{model.details.parameter_size}</span>
                            <span>•</span>
                            <span>{model.details.format}</span>
                            {model.details.quantization_level && (
                              <>
                                <span>•</span>
                                <span>{model.details.quantization_level}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {isDownloading ? (
                          <div className="flex w-full flex-col items-end gap-2">
                            {Object.values(downloadStates)
                              .filter((x) => x.modelId === model.name)
                              .map((item, i) => (
                                <div
                                  className="mt-1.5 flex w-full items-center gap-2"
                                  key={i}
                                >
                                  <Progress
                                    className="w-full"
                                    value={
                                      formatDownloadPercentage(item?.percent, {
                                        hidePercentage: true,
                                      }) as number
                                    }
                                  />
                                  <div className="flex items-center justify-between gap-x-2">
                                    <div className="flex gap-x-2">
                                      <span className="font-medium text-[hsla(var(--primary-bg))]">
                                        {formatDownloadPercentage(item?.percent)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            <span className="text-[hsla(var(--text-secondary))]">
                              {toGibibytes(model.size)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end justify-end gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                theme="ghost"
                                className="!bg-[hsla(var(--danger-bg))]"
                                onClick={async () => {
                                  if (window.confirm(`确定要删除模型 ${model.name} 吗？`)) {
                                    const success = await deleteModel(model.name)
                                    if (success) {
                                      const models = await listLocalModels()
                                      setLocalModels(models)
                                    } else {
                                      alert('删除模型失败')
                                    }
                                  }
                                }}
                              >
                                <Trash2Icon size={16} />
                              </Button>
                            </div>
                            <span className="text-[hsla(var(--text-secondary))]">
                              {toGibibytes(model.size)}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </Fragment>
            </div>
          </div>
        </div>
      </ScrollArea>
    </CenterPanelContainer>
  )
}

export default OnDeviceStarterScreen
