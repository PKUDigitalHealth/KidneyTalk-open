import { Fragment } from 'react'

import { Button, Tooltip, Input, Modal, ModalClose } from '@janhq/joi'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightOpenIcon,
  PanelRightCloseIcon,
  MinusIcon,
  MenuIcon,
  SquareIcon,
  PaletteIcon,
  XIcon,
  MessageCircleIcon, // 表示自由对话的图标
  FileTextIcon,
  SquareCodeIcon,
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'

import LogoMark from '@/containers/Brand/Logo/Mark'

import { toaster } from '@/containers/Toast'

import { MainViewState } from '@/constants/screens'

import { useCreateNewThread } from '@/hooks/useCreateNewThread'
import { useStarterScreen } from '@/hooks/useStarterScreen'

import {
  mainViewStateAtom,
  showLeftPanelAtom,
  showRightPanelAtom,
} from '@/helpers/atoms/App.atom'
import { assistantsAtom } from '@/helpers/atoms/Assistant.atom'
import {
  reduceTransparentAtom,
  selectedSettingAtom,
} from '@/helpers/atoms/Setting.atom'
import { activeTabThreadRightPanelAtom } from '@/helpers/atoms/ThreadRightPanel.atom'

const TopPanel = () => {
  const [showLeftPanel, setShowLeftPanel] = useAtom(showLeftPanelAtom)
  const [showRightPanel, setShowRightPanel] = useAtom(showRightPanelAtom)
  const [mainViewState, setMainViewState] = useAtom(mainViewStateAtom)
  const setSelectedSetting = useSetAtom(selectedSettingAtom)
  const reduceTransparent = useAtomValue(reduceTransparentAtom)
  const { requestCreateNewThread } = useCreateNewThread()
  const assistants = useAtomValue(assistantsAtom)
  const [activeTabThreadRightPanel, setActiveTabThreadRightPanel] = useAtom(
    activeTabThreadRightPanelAtom
  )

  const onCreateNewStructuringClick = () => {
    const structuringAssistant = assistants.find(assistant => assistant.id === 'structuring')
    if (!structuringAssistant)
      return toaster({
        title: 'No assistant available.',
        description: `Could not create a new thread. Please add an assistant.`,
        type: 'error',
      })
    console.log('onCreateNewStructuringClick', structuringAssistant)
    requestCreateNewThread(structuringAssistant)
  }

  const onCreateNewSummarisationClick = () => {
    const summarisationAssistant = assistants.find(assistant => assistant.id === 'summarisation')
    if (!summarisationAssistant)
      return toaster({
        title: 'No assistant available.',
        description: `Could not create a new thread. Please add an assistant.`,
        type: 'error',
      })
    console.log('onCreateNewSummarisationClick', summarisationAssistant)
    requestCreateNewThread(summarisationAssistant)
  }

  const onCreateNewThreadClick = () => {
    if (!assistants.length)
      return toaster({
        title: 'No assistant available.',
        description: `Could not create a new thread. Please add an assistant.`,
        type: 'error',
      })
    requestCreateNewThread(assistants[0])
  }

  const { isShowStarterScreen } = useStarterScreen()

  return (
    <div
      className={twMerge(
        'fixed z-50 flex h-9 w-full items-center px-4',
        isMac && 'border-t-0 pl-20',
        reduceTransparent &&
        'border-b border-[hsla(var(--app-border))] bg-[hsla(var(--top-panel-bg))]'
      )}
    >
      {!isMac && <LogoMark width={24} height={24} className="-ml-1 mr-2" />}
      <div className="flex w-full items-center justify-between text-[hsla(var(--text-secondary))]">
        <div className="unset-drag flex cursor-pointer gap-x-0.5">
          {!isMac && (
            <Button
              theme="icon"
              onClick={() => {
                window?.electronAPI?.showOpenMenu(100, 100)
              }}
            >
              <MenuIcon size={16} />
            </Button>
          )}
          {mainViewState !== MainViewState.Hub && (
            <Fragment>
              {showLeftPanel ? (
                <Button theme="icon" onClick={() => setShowLeftPanel(false)}>
                  <PanelLeftCloseIcon size={16} />
                </Button>
              ) : (
                <Button theme="icon" onClick={() => setShowLeftPanel(true)}>
                  <PanelLeftOpenIcon size={16} />
                </Button>
              )}
            </Fragment>
          )}
          {mainViewState === MainViewState.Thread && !isShowStarterScreen && (
            <div className="flex items-center gap-x-1">
              <Tooltip
                trigger={
                  <Button
                    data-testid="btn-create-thread"
                    onClick={onCreateNewThreadClick}
                    theme="icon"
                  >
                    <MessageCircleIcon
                      size={16}
                      className="cursor-pointer text-[hsla(var(--text-secondary))]"
                    />
                  </Button>
                }
                content="Initiate an open conversation"
              />

              <Tooltip
                trigger={
                  <Button
                    data-testid="btn-create-thread"
                    onClick={onCreateNewStructuringClick}
                    theme="icon"
                  >
                    <SquareCodeIcon
                      size={16}
                      className="cursor-pointer text-[hsla(var(--text-secondary))]"
                    />
                  </Button>
                }
                content="Initiate a structuring conversation"
              />

              <Tooltip
                trigger={
                  <Button
                    data-testid="btn-create-thread"
                    onClick={onCreateNewSummarisationClick}
                    theme="icon"
                  >
                    <FileTextIcon
                      size={16}
                      className="cursor-pointer text-[hsla(var(--text-secondary))]"
                    />
                  </Button>
                }
                content="Initiate a summarisation conversation"
              />



            </div>
          )}
        </div>
        <div className="unset-drag flex items-center gap-x-2">
          {mainViewState !== MainViewState.Hub &&
            mainViewState !== MainViewState.Settings && (
              <Fragment>
                {showRightPanel ? (
                  <Button
                    theme="icon"
                    onClick={() => {
                      setShowRightPanel(false)
                      if (activeTabThreadRightPanel === 'model') {
                        setActiveTabThreadRightPanel(undefined)
                      }
                    }}
                  >
                    <PanelRightCloseIcon size={16} />
                  </Button>
                ) : (
                  <Button
                    theme="icon"
                    onClick={() => {
                      setShowRightPanel(true)
                      if (activeTabThreadRightPanel === undefined) {
                        setActiveTabThreadRightPanel('model')
                      }
                    }}
                  >
                    <PanelRightOpenIcon size={16} />
                  </Button>
                )}
              </Fragment>
            )}
          <Button
            theme="icon"
            onClick={() => {
              setMainViewState(MainViewState.Settings)
              setSelectedSetting('Preferences')
            }}
          >
            <PaletteIcon size={16} className="cursor-pointer" />
          </Button>

          {!isMac && (
            <div className="flex items-center gap-x-2">
              <Button
                theme="icon"
                onClick={() => window?.electronAPI?.setMinimizeApp()}
              >
                <MinusIcon size={16} />
              </Button>
              <Button
                theme="icon"
                onClick={() => window?.electronAPI?.setMaximizeApp()}
              >
                <SquareIcon size={14} />
              </Button>
              <Button
                theme="icon"
                onClick={() => window?.electronAPI?.setCloseApp()}
              >
                <XIcon size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default TopPanel
