import {
  ChatArea,
  ModelDownloaderModal,
  ModelManagerModal,
  SettingsModal,
  Sidebar,
} from "./components";
import { AppProvider } from "./contexts/store";

function App() {
  return (
    <AppProvider>
      <div className="flex h-screen bg-gray-100 text-gray-100 dark:bg-gray-900 dark:text-gray-100">
        <Sidebar />

        <ChatArea />

        <SettingsModal />

        <ModelManagerModal />

        <ModelDownloaderModal />
      </div>
    </AppProvider>
  );
}

export default App;
