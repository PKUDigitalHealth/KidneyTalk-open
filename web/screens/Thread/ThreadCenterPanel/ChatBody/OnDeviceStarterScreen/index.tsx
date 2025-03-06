import React, { Fragment, useState, useEffect } from 'react'
import { Button, Input, Progress, ScrollArea, Tooltip } from '@janhq/joi'
import { useClickOutside } from '@janhq/joi'
import { useAtomValue, useSetAtom } from 'jotai'
import { DownloadCloudIcon, Trash2Icon, StarIcon } from 'lucide-react'
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
    name: 'deepseek-r1',
    displayName: 'deepseek-r1:latest',
  },
  {
    name: 'qwen2.5:3b',
    displayName: 'qwen2.5:3B',
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
    const fetchLocalModels = async () => {
      const models = await listLocalModels()
      setLocalModels(models)
    }
    
    fetchLocalModels()
    const interval = setInterval(fetchLocalModels, 30000)
    
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

  return (
    <CenterPanelContainer isShowStarterScreen={isShowStarterScreen}>
      <ScrollArea className="flex h-full w-full items-center">
        <div className="relative mt-4 flex h-full w-full flex-col items-center justify-center">
          <div className="mx-auto flex h-full w-3/4 flex-col items-center justify-center py-16 text-center">
            {/* <LogoMark
              className="mx-auto mb-4 animate-wave"
              width={48}
              height={48}
            /> */}
            <h1 className="text-base font-medium">Ollama Model Hub</h1>
            <div className="mt-6 w-[320px] md:w-[400px]">
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
                    />
                    <Button
                      theme="primary"
                      disabled={!searchValue.trim() || downloadProgress !== null}
                      onClick={() => {
                        const modelName = searchValue.trim()
                        setDownloadProgress({ modelName, status: 'starting' })
                        
                        pullModel(modelName, {
                          onProgress: (response) => {
                            if (response.status === 'success') {
                              setDownloadProgress(null)
                              setSearchValue('')
                              // 刷新本地模型列表
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
                      Download
                    </Button>
                  </div>
                  
                  {/* 下载进度显示 */}
                  {downloadProgress && (
                    <div className="mt-4 rounded-lg border border-[hsla(var(--app-border))] bg-[hsla(var(--app-bg))] p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">{downloadProgress.modelName}</span>
                        <span className="text-sm text-[hsla(var(--text-secondary))]">
                          {downloadProgress.status === 'starting' && 'Preparing download...'}
                          {downloadProgress.status === 'pulling manifest' && 'Getting model info...'}
                          {downloadProgress.status === 'downloading' && 'Downloading...'}
                          {downloadProgress.status === 'verifying sha256 digest' && 'Verifying file...'}
                          {downloadProgress.status === 'writing manifest' && 'Writing file...'}
                        </span>
                      </div>
                      
                      {downloadProgress.progress !== undefined && (
                        <div className="flex items-center gap-2">
                          <Progress
                            className="flex-1"
                            value={downloadProgress.progress}
                          />
                          <span className="min-w-[4rem] text-right text-sm">
                            {downloadProgress.progress.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <h2 className="text-[hsla(var(--text-secondary))]">
                    Available Models
                  </h2>
                  {/* <p
                    className="cursor-pointer text-sm text-[hsla(var(--text-secondary))]"
                    onClick={() => {
                      setMainViewState(MainViewState.Hub)
                    }}
                  >
                    See All
                  </p> */}
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
                                className="!bg-[hsla(var(--secondary-bg))]"
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
                                Download
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
