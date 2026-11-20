import { Header } from './components/layout/Header';
import { DashboardGrid } from './components/layout/DashboardGrid';
import { MissionStatusBar } from './components/layout/MissionStatusBar';
import { useTelemetry } from './hooks/useTelemetry';

function App() {
  useTelemetry();

  return (
    <div className="h-screen flex flex-col bg-[#0a0e17] overflow-hidden">
      <Header />
      <DashboardGrid />
      <MissionStatusBar />
    </div>
  );
}

export default App;
