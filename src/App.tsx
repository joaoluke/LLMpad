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
      <div className="flex h-screen bg-gray-900 text-gray-100">
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
