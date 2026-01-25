import { FileCode, RefreshCw } from "lucide-react";
import { ModelFile } from "../types";

interface ModelManagerModalProps {
  modelFiles: ModelFile[];
  onCreateModel: (modelFile: ModelFile) => void;
  onRefresh: () => void;
  onClose: () => void;
}

export function ModelManagerModal({
  modelFiles,
  onCreateModel,
  onRefresh,
  onClose,
}: ModelManagerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Modelos Customizados</h2>

        <p className="text-sm text-gray-400 mb-4">
          Modelfiles encontrados na pasta{" "}
          <code className="bg-gray-700 px-1 rounded">models/</code>
        </p>

        {modelFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileCode size={48} className="mx-auto mb-3 opacity-50" />
            <p>Nenhum Modelfile encontrado</p>
            <p className="text-xs mt-2">
              Crie arquivos .Modelfile na pasta models/ do projeto
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {modelFiles.map((modelFile) => (
              <div key={modelFile.name} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{modelFile.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {modelFile.path}
                    </p>
                  </div>
                  <button
                    onClick={() => onCreateModel(modelFile)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                  >
                    Criar no Ollama
                  </button>
                </div>
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                    Ver Modelfile
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-900 p-3 rounded overflow-x-auto">
                    {modelFile.content}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={onRefresh}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </div>
    </div>
  );
}
