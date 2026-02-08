import { Download, Loader2 } from "lucide-react";

import { useAppContext } from "../contexts/store";
import { POPULAR_MODELS } from "../utils/models";

export function ModelDownloaderModal() {
  const {
    downloadingModel,
    downloadPercent,
    setShowModelDownloader,
    setShowSettings,
    downloadProgress,
    ollamaModels,
    downloadOllamaModel,
    showModelDownloader,
  } = useAppContext();

  if (!showModelDownloader) return null;

  return (
    <div className="fixed inset-0 dark:bg-black/50 bg-white/50 flex items-center justify-center z-50">
      <div className="dark:bg-gray-800 bg-gray-200 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl dark:text-gray-400 text-gray-600 font-semibold mb-4">Baixar Modelos do Ollama</h2>

        <p className="text-sm dark:text-gray-400 text-gray-600 mb-4">
          Selecione um modelo para baixar. Os modelos serão baixados diretamente
          do Ollama.
        </p>

        {downloadingModel && (
          <div className="mb-4 p-4 dark:bg-gray-700 bg-gray-300 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="font-medium">
                Baixando {downloadingModel}...
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-2">{downloadProgress}</p>
            {downloadPercent !== null && (
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadPercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {POPULAR_MODELS.map((model) => {
            const isInstalled = ollamaModels.some((m) =>
              m.startsWith(model.name.split(":")[0]),
            );
            const isDownloading = downloadingModel === model.name;

            return (
              <div
                key={model.name}
                className="flex items-center justify-between p-3 dark:bg-gray-700 bg-gray-300 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium dark:text-gray-400 text-gray-600">{model.name}</span>
                    <span className="text-xs dark:text-gray-400 text-gray-600">
                      ({model.size})
                    </span>
                    {isInstalled && (
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded">
                        Instalado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {model.description}
                  </p>
                </div>
                <button
                  onClick={() => downloadOllamaModel(model.name)}
                  disabled={isDownloading || !!downloadingModel}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors flex items-center gap-1"
                >
                  {isDownloading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Download size={14} />
                  )}
                  {isInstalled ? "Atualizar" : "Baixar"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setShowModelDownloader(false);
              setShowSettings(true);
            }}
            disabled={!!downloadingModel}
            className="flex-1 px-4 py-2 dark:bg-gray-700 bg-gray-400 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
