import CenterPanelContainer from '@/containers/CenterPanelContainer'
import OnDeviceStarterScreen from '@/screens/Thread/ThreadCenterPanel/ChatBody/OnDeviceStarterScreen'

const HubScreen = () => {
  return (
    <CenterPanelContainer>
      <OnDeviceStarterScreen isShowStarterScreen={true} />
    </CenterPanelContainer>
  )
}

export default HubScreen
