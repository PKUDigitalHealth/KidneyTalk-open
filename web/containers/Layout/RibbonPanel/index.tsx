import { Tooltip, useMediaQuery } from '@janhq/joi'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  MessageCircleIcon,
  SettingsIcon,
  LayoutGridIcon,
  SquareCodeIcon,
  BookOpenIcon,
} from 'lucide-react'

import { twMerge } from 'tailwind-merge'

import { MainViewState } from '@/constants/screens'

import { mainViewStateAtom, showLeftPanelAtom } from '@/helpers/atoms/App.atom'
import { editMessageAtom } from '@/helpers/atoms/ChatMessage.atom'
import { serverEnabledAtom } from '@/helpers/atoms/LocalServer.atom'

import { isDownloadALocalModelAtom } from '@/helpers/atoms/Model.atom'
import {
  reduceTransparentAtom,
  selectedSettingAtom,
} from '@/helpers/atoms/Setting.atom'
import { threadsAtom } from '@/helpers/atoms/Thread.atom'

export default function RibbonPanel() {
  const [mainViewState, setMainViewState] = useAtom(mainViewStateAtom)
  const [serverEnabled] = useAtom(serverEnabledAtom)
  const setEditMessage = useSetAtom(editMessageAtom)
  const showLeftPanel = useAtomValue(showLeftPanelAtom)
  const matches = useMediaQuery('(max-width: 880px)')
  const reduceTransparent = useAtomValue(reduceTransparentAtom)
  const setSelectedSetting = useSetAtom(selectedSettingAtom)

  const threads = useAtomValue(threadsAtom)
  const isDownloadALocalModel = useAtomValue(isDownloadALocalModelAtom)

  const onMenuClick = (state: MainViewState) => {
    if (mainViewState === state) return
    if (serverEnabled && state === MainViewState.Thread) return
    if (state === MainViewState.Settings) setSelectedSetting('My Models')
    setMainViewState(state)
    setEditMessage('')
  }

  const TopRibbonNavMenus = [
    {
      name: 'Thread',
      icon: (
        <MessageCircleIcon
          size={18}
          className={twMerge(
            'flex-shrink-0',
            serverEnabled && 'text-[hsla(var(--disabled-fg))]'
          )}
        />
      ),
      state: MainViewState.Thread,
    },
    // {
    //   name: 'Summarisation',
    //   icon: <SquareCodeIcon size={18} className="flex-shrink-0" />,
    //   state: MainViewState.Summarisation,
    // },
    // {
    //   name: 'Structuring',
    //   icon: <SquareCodeIcon size={18} className="flex-shrink-0" />,
    //   state: MainViewState.Structuring,
    // },
  ]

  const BottomRibbonNavMenus = [
    {
      name: 'Knowledge',
      icon: <BookOpenIcon size={18} className="flex-shrink-0" />,
      state: MainViewState.Knowledge,
    },
    {
      name: 'Hub',
      icon: <LayoutGridIcon size={18} className="flex-shrink-0" />,
      state: MainViewState.Hub,
    },
    {
      name: 'Local API Server',
      icon: <SquareCodeIcon size={18} className="flex-shrink-0" />,
      state: MainViewState.LocalServer,
    },
    {
      name: 'Settings',
      icon: <SettingsIcon size={18} className="flex-shrink-0" />,
      state: MainViewState.Settings,
    },
  ]

  return (
    <div
      className={twMerge(
        'relative top-0 flex h-full w-12 flex-shrink-0 flex-col items-center border-r border-[hsla(var(--app-border))] py-2',
        mainViewState === MainViewState.Hub &&
          !reduceTransparent &&
          'border-none',
        !showLeftPanel && !reduceTransparent && 'border-none',
        matches && !reduceTransparent && 'border-none',
        reduceTransparent && ' bg-[hsla(var(--ribbon-panel-bg))]',
        mainViewState === MainViewState.Thread &&
          !isDownloadALocalModel &&
          !threads.length &&
          'border-none'
      )}
    >
      <div className="flex flex-col items-center">
        {TopRibbonNavMenus.map((menu, i) => (
          <RibbonMenuItem
            key={i}
            menu={menu}
            isActive={mainViewState === menu.state}
            onClick={() => onMenuClick(menu.state)}
            serverEnabled={serverEnabled}
          />
        ))}
      </div>
      
      <div className="mt-auto flex flex-col items-center">
        {BottomRibbonNavMenus.map((menu, i) => (
          <RibbonMenuItem
            key={i}
            menu={menu}
            isActive={mainViewState === menu.state}
            onClick={() => onMenuClick(menu.state)}
            serverEnabled={serverEnabled}
          />
        ))}
      </div>
    </div>
  )
}

interface RibbonMenuItemProps {
  menu: {
    name: string
    icon: React.ReactNode
    state: MainViewState
  }
  isActive: boolean
  onClick: () => void
  serverEnabled: boolean
}

function RibbonMenuItem({ menu, isActive, onClick, serverEnabled }: RibbonMenuItemProps) {
  return (
    <div
      className="relative my-0.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-[hsla(var(--ribbon-panel-icon-hover))]"
      onClick={onClick}
    >
      <Tooltip
        side="right"
        disabled={isActive}
        trigger={
          <div>
            <div
              data-testid={menu.name}
              className={twMerge(
                'relative flex w-full flex-shrink-0 cursor-pointer items-center justify-center rounded-md p-1.5 text-[hsla(var(--ribbon-panel-icon))]',
                isActive &&
                  'z-10 bg-[hsla(var(--ribbon-panel-icon-active-bg))] text-[hsla(var(--ribbon-panel-icon-active))]'
              )}
            >
              {menu.icon}
            </div>
          </div>
        }
        content={
          serverEnabled && menu.state === MainViewState.Thread
            ? 'Threads are disabled while the server is running'
            : menu.name
        }
      />
    </div>
  )
}
