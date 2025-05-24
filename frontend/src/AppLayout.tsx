import DynamicLayout from './components/layout/DynamicLayout';
import MainContainer from './components/layout/MainContainer';
import SideNavigationPane from './components/navigation/Side Nav/SideNavigationPane';
import TopNavigationPane from './components/navigation/TopNavigationPane';

// App wrapper: provides small margin around entire UI
export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen flex-col gap-2 p-2">
      <TopNavigationPane />
      <div className="flex flex-1 min-w-0 gap-2 overflow-hidden">
        <SideNavigationPane />
        <MainContainer>
          <DynamicLayout />
        </MainContainer>
      </div>
    </div>
  );
}
