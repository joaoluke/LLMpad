import { RefreshCw, FileCode, Download } from "lucide-react";
import { IAppSettings } from "../types";

interface SettingsModalProps {
  settings: IAppSettings;
  ollamaModels: string[];
  modelFilesCount: number;
  onSettingsChange: (settings: IAppSettings) => void;
  onSave: () => void;
  onClose: () => void;
  onRefreshModels: () => void;
  onOpenModelManager: () => void;
  onOpenModelDownloader: () => void;
}

export function SettingsModal({
  settings,
  ollamaModels,
  modelFilesCount,
  onSettingsChange,
  onSave,
  onClose,
  onRefreshModels,
  onOpenModelManager,
  onOpenModelDownloader,
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Configurações</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              URL da API
            </label>
            <input
              type="text"
              value={settings.api_url}
              onChange={(e) =>
                onSettingsChange({ ...settings, api_url: e.target.value })
              }
              placeholder="http://localhost:11434/v1"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              API Key (opcional)
            </label>
            <input
              type="password"
              value={settings.api_key}
              onChange={(e) =>
                onSettingsChange({ ...settings, api_key: e.target.value })
              }
              placeholder="sk-..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1 flex items-center justify-between">
              <span>Modelo</span>
              <button
                onClick={onRefreshModels}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <RefreshCw size={12} />
                Atualizar
              </button>
            </label>
            {ollamaModels.length > 0 ? (
              <select
                value={settings.model}
                onChange={(e) =>
                  onSettingsChange({ ...settings, model: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                {ollamaModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={settings.model}
                onChange={(e) =>
                  onSettingsChange({ ...settings, model: e.target.value })
                }
                placeholder="llama3.2"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={onOpenModelManager}
                className="flex-1 text-xs text-gray-400 hover:text-gray-300 flex items-center justify-center gap-1 py-1 bg-gray-700 rounded"
              >
                <FileCode size={14} />
                Customizados ({modelFilesCount})
              </button>
              <button
                onClick={onOpenModelDownloader}
                className="flex-1 text-xs text-gray-400 hover:text-gray-300 flex items-center justify-center gap-1 py-1 bg-gray-700 rounded"
              >
                <Download size={14} />
                Baixar Modelos
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
