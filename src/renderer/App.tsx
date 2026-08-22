// src/renderer/App.tsx
import { useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { DropZone } from './components/DropZone';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ControlPanel } from './components/ControlPanel';
import { BatchQueueModal } from './components/BatchQueueModal';
import { ReadmeModal } from './components/ReadmeModal';
import { useSettings } from './hooks/useSettings';
import { useImageProcessor } from './hooks/useImageProcessor';

export function App() {
  const { settings, updateSettings } = useSettings();
  const {
    items,
    selectedIndex,
    selectedItem,
    setSelectedIndex,
    detectedBox,
    isDetecting,
    isProcessing,
    batchProgress,
    isBatchModalOpen,
    setIsBatchModalOpen,
    addFiles,
    pickFiles,
    pickDirectory,
    startProcessing,
    cancelProcessing,
    openOutputFolder,
    clearItems,
  } = useImageProcessor(settings);

  const [isReadmeOpen, setIsReadmeOpen] = useState(false);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#12141a] text-text-primary rounded-xl border border-white/[0.12] overflow-hidden select-none shadow-[0_12px_48px_rgba(0,0,0,0.7)]">
      {/* Title Bar */}
      <TitleBar onOpenReadme={() => setIsReadmeOpen(true)} />

      {/* Main App Canvas */}
      <DropZone onFilesDropped={addFiles}>
        <main className="flex-1 flex gap-3 p-3 overflow-hidden bg-[#12141a]">
          {/* Left: Preview Canvas Area */}
          <PreviewCanvas
            selectedItem={selectedItem}
            detectedBox={detectedBox}
            isLoading={isDetecting}
          />

          {/* Right: Inspector Control Panel */}
          <ControlPanel
            settings={settings}
            onUpdateSettings={updateSettings}
            items={items}
            selectedItemIndex={selectedIndex}
            onSelectItem={setSelectedIndex}
            onClearItems={clearItems}
            onPickFiles={pickFiles}
            onPickDirectory={pickDirectory}
            onStartProcessing={startProcessing}
            isProcessing={isProcessing}
          />
        </main>
      </DropZone>

      {/* Batch Processing Progress Modal */}
      <BatchQueueModal
        isOpen={isBatchModalOpen}
        progress={batchProgress}
        onCancel={cancelProcessing}
        onClose={() => setIsBatchModalOpen(false)}
        onOpenFolder={openOutputFolder}
      />

      {/* Readme Help Dialog Modal */}
      <ReadmeModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
      />
    </div>
  );
}

export default App;
