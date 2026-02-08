import { FileCode, RefreshCw } from "lucide-react";

import { useAppContext } from "../contexts/store";

export function ModelManagerModal() {
  const {
    modelFiles,
    createModelInOllama,
    setShowModelManager,
    setShowSettings,
    loadModelFiles,
    loadOllamaModels,
    showModelManager,
  } = useAppContext();

  if (!showModelManager) return null;

  return (
    <div className="fixed inset-0 dark:bg-black/50 bg-white/50 flex items-center justify-center z-50">
      <div className="dark:bg-gray-800 bg-gray-200 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl dark:text-gray-400 text-gray-600 font-semibold mb-4">Modelos Customizados</h2>

        <p className="text-sm dark:text-gray-400 text-gray-600 mb-4">
          Modelfiles encontrados na pasta{" "}
          <code className="dark:bg-gray-700 bg-gray-300 px-1 rounded">models/</code>
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
              <div key={modelFile.name} className="dark:bg-gray-700 bg-gray-300 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium dark:text-gray-400 text-gray-600">{modelFile.name}</h3>
                    <p className="text-xs dark:text-gray-400 text-gray-600 mt-1">
                      {modelFile.path}
                    </p>
                  </div>
                  <button
                    onClick={() => createModelInOllama(modelFile)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                  >
                    Criar no Ollama
                  </button>
                </div>
                <details className="mt-2">
                  <summary className="text-xs dark:text-gray-400 text-gray-600 cursor-pointer hover:text-gray-500 dark:hover:text-gray-200">
                    Ver Modelfile
                  </summary>
                  <pre className="mt-2 text-xs dark:bg-gray-900 bg-gray-400 p-3 rounded overflow-x-auto">
                    {modelFile.content}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setShowModelManager(false);
              setShowSettings(true);
            }}
            className="flex-1 px-4 py-2 dark:bg-gray-700 bg-gray-400 dark:hover:bg-gray-600 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => {
              loadModelFiles();
              loadOllamaModels();
            }}
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
