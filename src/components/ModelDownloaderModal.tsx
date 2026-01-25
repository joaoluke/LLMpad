import { Download, Loader2 } from "lucide-react";

const POPULAR_MODELS = [
  { name: "llama3.2", size: "2GB", description: "Meta's Llama 3.2 - Rápido e eficiente" },
  { name: "llama3.2:1b", size: "1.3GB", description: "Llama 3.2 1B - Ultra leve" },
  { name: "mistral", size: "4.1GB", description: "Mistral 7B - Excelente qualidade" },
  { name: "phi3", size: "2.2GB", description: "Microsoft Phi-3 - Compacto e capaz" },
  { name: "gemma2:2b", size: "1.6GB", description: "Google Gemma 2 2B - Leve" },
  { name: "qwen2.5:3b", size: "1.9GB", description: "Alibaba Qwen 2.5 3B" },
  { name: "codellama", size: "3.8GB", description: "Meta CodeLlama - Para código" },
  { name: "deepseek-coder:6.7b", size: "3.8GB", description: "DeepSeek Coder - Programação" },
];

interface ModelDownloaderModalProps {
  downloadingModel: string | null;
  downloadProgress: string;
  downloadPercent: number | null;
  installedModels: string[];
  onDownload: (modelName: string) => void;
  onClose: () => void;
}

export function ModelDownloaderModal({
  downloadingModel,
  downloadProgress,
  downloadPercent,
  installedModels,
  onDownload,
  onClose,
}: ModelDownloaderModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Baixar Modelos do Ollama</h2>

        <p className="text-sm text-gray-400 mb-4">
          Selecione um modelo para baixar. Os modelos serão baixados diretamente do Ollama.
        </p>

        {downloadingModel && (
          <div className="mb-4 p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="font-medium">Baixando {downloadingModel}...</span>
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
            const isInstalled = installedModels.some(
              (m) => m.startsWith(model.name.split(":")[0])
            );
            const isDownloading = downloadingModel === model.name;

            return (
              <div
                key={model.name}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-gray-400">({model.size})</span>
                    {isInstalled && (
                      <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded">
                        Instalado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{model.description}</p>
                </div>
                <button
                  onClick={() => onDownload(model.name)}
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
            onClick={onClose}
            disabled={!!downloadingModel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
