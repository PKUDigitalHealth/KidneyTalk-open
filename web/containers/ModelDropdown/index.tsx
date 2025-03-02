import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { InferenceEngine, Model } from '@janhq/core'
import {
  Badge,
  Input,
  ScrollArea,
  useClickOutside,
} from '@janhq/joi'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'

import {
  ChevronDownIcon,
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { useCreateNewThread } from '@/hooks/useCreateNewThread'
import useRecommendedModel from '@/hooks/useRecommendedModel'

import useUpdateModelParameters from '@/hooks/useUpdateModelParameters'
import {
  isLocalEngine,
} from '@/utils/modelEngine'

import { extensionManager } from '@/extension'

import { activeAssistantAtom } from '@/helpers/atoms/Assistant.atom'
import {
  configuredModelsAtom,
  getDownloadingModelAtom,
  selectedModelAtom,
  showEngineListModelAtom,
} from '@/helpers/atoms/Model.atom'
import {
  activeThreadAtom,
  setThreadModelParamsAtom,
} from '@/helpers/atoms/Thread.atom'

type Props = {
  chatInputMode?: boolean
  strictedThread?: boolean
  disabled?: boolean
}

export const modelDropdownStateAtom = atom(false)

const ModelDropdown = ({
  disabled,
  chatInputMode,
  strictedThread = true,
}: Props) => {
  const [modelDropdownState, setModelDropdownState] = useAtom(
    modelDropdownStateAtom
  )

  const [searchFilter, setSearchFilter] = useState('ollama')
  const [searchText, setSearchText] = useState('')
  const [open, setOpen] = useState<boolean>(modelDropdownState)
  const activeThread = useAtomValue(activeThreadAtom)
  const activeAssistant = useAtomValue(activeAssistantAtom)
  const downloadingModels = useAtomValue(getDownloadingModelAtom)
  const [toggle, setToggle] = useState<HTMLDivElement | null>(null)
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom)
  const { recommendedModel, downloadedModels } = useRecommendedModel()
  const [dropdownOptions, setDropdownOptions] = useState<HTMLDivElement | null>(
    null
  )

  const setThreadModelParams = useSetAtom(setThreadModelParamsAtom)
  const { updateModelParameter } = useUpdateModelParameters()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const configuredModels = useAtomValue(configuredModelsAtom)

  const { updateThreadMetadata } = useCreateNewThread()

  useClickOutside(() => handleChangeStateOpen(false), null, [
    dropdownOptions,
    toggle,
  ])

  const [showEngineListModel, setShowEngineListModel] = useAtom(
    showEngineListModelAtom
  )

  const handleChangeStateOpen = useCallback(
    (state: boolean) => {
      setOpen(state)
      setModelDropdownState(state)
    },
    [setModelDropdownState]
  )

  const isModelSupportRagAndTools = useCallback((model: Model) => {
    return (
      model?.engine === InferenceEngine.openai ||
      isLocalEngine(model?.engine as InferenceEngine)
    )
  }, [])

  const filteredDownloadedModels = useMemo(
    () =>
      configuredModels
        .concat(
          downloadedModels.filter(
            (e) => !configuredModels.some((x) => x.id === e.id)
          )
        )
        .filter((e) =>
          e.name.toLowerCase().includes(searchText.toLowerCase().trim())
        )
        .filter((e) => {
          if (searchFilter === 'ollama') {
            return e.engine === InferenceEngine.openai
          }
          return false
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => {
          const aInDownloadedModels = downloadedModels.some(
            (item) => item.id === a.id
          )
          const bInDownloadedModels = downloadedModels.some(
            (item) => item.id === b.id
          )
          if (aInDownloadedModels && !bInDownloadedModels) {
            return -1
          } else if (!aInDownloadedModels && bInDownloadedModels) {
            return 1
          } else {
            return 0
          }
        }),
    [configuredModels, searchText, searchFilter, downloadedModels]
  )

  useEffect(() => {
    if (modelDropdownState && chatInputMode) {
      setOpen(modelDropdownState)
    }
  }, [chatInputMode, modelDropdownState])

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!activeThread) return
    const modelId = activeAssistant?.model?.id

    let model = downloadedModels.find((model) => model.id === modelId)
    if (!model) {
      model = undefined
    }
    setSelectedModel(model)
  }, [
    recommendedModel,
    activeThread,
    downloadedModels,
    setSelectedModel,
    activeAssistant?.model?.id,
  ])

  const onClickModelItem = useCallback(
    async (modelId: string) => {
      if (!activeAssistant) return
      const model = downloadedModels.find((m) => m.id === modelId)
      setSelectedModel(model)
      setOpen(false)

      if (activeThread) {
        // Change assistand tools based on model support RAG
        updateThreadMetadata({
          ...activeThread,
          assistants: [
            {
              ...activeAssistant,
              tools: [
                {
                  type: 'retrieval',
                  enabled: isModelSupportRagAndTools(model as Model),
                  settings: {
                    ...(activeAssistant.tools &&
                      activeAssistant.tools[0]?.settings),
                  },
                },
              ],
            },
          ],
        })

        const defaultContextLength = Math.min(
          8192,
          model?.settings.ctx_len ?? 32768
        )
        const overriddenParameters = {
          ctx_len: !isLocalEngine(model?.engine)
            ? undefined
            : defaultContextLength,
          max_tokens: !isLocalEngine(model?.engine)
            ? (model?.parameters.max_tokens ?? 32768)
            : defaultContextLength,
        }

        const modelParams = {
          ...model?.parameters,
          ...model?.settings,
          ...overriddenParameters,
        }

        // Update model parameter to the thread state
        setThreadModelParams(activeThread.id, modelParams)

        // Update model parameter to the thread file
        if (model)
          updateModelParameter(activeThread, {
            params: modelParams,
            modelId: model.id,
            engine: model.engine,
          })
      }
    },
    [
      activeAssistant,
      downloadedModels,
      setSelectedModel,
      activeThread,
      updateThreadMetadata,
      isModelSupportRagAndTools,
      setThreadModelParams,
      updateModelParameter,
    ]
  )

  const [extensionHasSettings, setExtensionHasSettings] = useState<
    { name?: string; setting: string; apiKey: string; provider: string }[]
  >([])

  useEffect(() => {
    const getAllSettings = async () => {
      const extensionsMenu: {
        name?: string
        setting: string
        apiKey: string
        provider: string
      }[] = []
      const extensions = extensionManager.getAll()

      for (const extension of extensions) {
        if (typeof extension.getSettings === 'function') {
          const settings = await extension.getSettings()
          if (
            (settings && settings.length > 0) ||
            (await extension.installationState()) !== 'NotRequired'
          ) {
            extensionsMenu.push({
              name: extension.productName,
              setting: extension.name,
              apiKey:
                'apiKey' in extension && typeof extension.apiKey === 'string'
                  ? extension.apiKey
                  : '',
              provider:
                'provider' in extension &&
                typeof extension.provider === 'string'
                  ? extension.provider
                  : '',
            })
          }
        }
      }
      setExtensionHasSettings(extensionsMenu)
    }
    getAllSettings()
  }, [])

  const getEngineStatusReady: InferenceEngine[] = extensionHasSettings
    ?.filter((e) => e.apiKey.length > 0)
    .map((x) => x.provider as InferenceEngine)

  useEffect(() => {
    setShowEngineListModel((prev) => [
      ...prev,
      ...(getEngineStatusReady as InferenceEngine[]),
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setShowEngineListModel, extensionHasSettings])

  const isDownloadALocalModel = downloadedModels.some((x) =>
    isLocalEngine(x.engine)
  )

  if (strictedThread && !activeThread) {
    return null
  }

  return (
    <div
      className={twMerge('relative', disabled && 'pointer-events-none')}
      data-testid="model-selector"
    >
      <div className="flex [&>div]:w-full" ref={setToggle}>
        {chatInputMode ? (
          <Badge
            data-testid="model-selector-badge"
            theme="secondary"
            variant={open ? 'solid' : 'outline'}
            className={twMerge(
              'inline-block max-w-[200px] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap',
              open && 'border border-transparent'
            )}
            onClick={() => handleChangeStateOpen(!open)}
          >
            <span
              className={twMerge(
                !selectedModel && 'text-[hsla(var(--text-tertiary))]'
              )}
            >
              {selectedModel?.name || 'Select a model'}
            </span>
          </Badge>
        ) : (
          <Input
            value={selectedModel?.name || ''}
            className="cursor-pointer"
            placeholder="Select a model"
            disabled={disabled}
            readOnly
            suffixIcon={
              <ChevronDownIcon
                size={14}
                className={twMerge(open && 'rotate-180')}
              />
            }
            onClick={() => setOpen(!open)}
          />
        )}
      </div>
      <div
        className={twMerge(
          'absolute right-0 z-20 mt-2 max-h-80 w-full overflow-hidden rounded-lg border border-[hsla(var(--app-border))] bg-[hsla(var(--app-bg))] shadow-sm',
          open ? 'flex' : 'hidden',
          chatInputMode && 'bottom-8 left-0 w-72'
        )}
        ref={setDropdownOptions}
      >
        <div className="w-full">
          <ScrollArea className="h-full w-full">
            <ul className="pb-2">
              {filteredDownloadedModels.map((model) => {
                const isDownloading = downloadingModels.some(
                  (md) => md === model.id
                )
                const isDownloaded = downloadedModels.some(
                  (c) => c.id === model.id
                )
                return (
                  <li
                    key={model.id}
                    className={twMerge(
                      'flex items-center justify-between gap-4 px-3 py-2 hover:bg-[hsla(var(--dropdown-menu-hover-bg))]',
                      'text-[hsla(var(--text-primary))]'
                    )}
                    onClick={() => {
                      if (isDownloaded) {
                        onClickModelItem(model.id)
                      }
                    }}
                  >
                    <div className="flex gap-x-2">
                      <p
                        className={twMerge(
                          'line-clamp-1',
                          !isDownloaded &&
                            'text-[hsla(var(--text-secondary))]'
                        )}
                        title={model.name}
                      >
                        {model.name}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

export default ModelDropdown
