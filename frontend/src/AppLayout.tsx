import MainContainer from './components/layout/MainContainer';
import ChatPane from './components/layout/chat/ChatPane';
import ExplorerPane from './components/layout/explorer/ExplorerPane';
import MainPane from './components/layout/main/MainPane';
import SideNavigationPane from './components/navigation/SideNavigationPane';
import TopNavigationPane from './components/navigation/TopNavigationPane';

// App wrapper: provides small margin around entire UI
export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen flex-col gap-2 p-2">
      <TopNavigationPane />
      <div className="flex flex-1 justify-center gap-2">
        <SideNavigationPane />
        <MainContainer>
          <ExplorerPane />
          <MainPane />
          <ChatPane />
        </MainContainer>
      </div>
    </div>
  );
}
