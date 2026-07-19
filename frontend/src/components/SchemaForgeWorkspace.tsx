'use client';

import { useSchemaEditor } from '@/lib/useSchemaEditor';
import { DashboardLayout } from './layout/DashboardLayout';
import { InputPanel } from './workspace/InputPanel';
import { OutputPanel } from './workspace/OutputPanel';
import { ImageUploadModal } from './workspace/ImageUploadModal';

export function SchemaForgeWorkspace() {
  const editor = useSchemaEditor();

  return (
    <DashboardLayout>
      <div className="flex min-h-0 flex-col gap-4 md:gap-6 lg:h-full lg:flex-row">
        <InputPanel
          source={editor.source}
          status={editor.status}
          inputError={editor.inputError}
          isReadyForGenerate={editor.isReadyForGenerate}
          textareaRef={editor.textareaRef}
          onSourceChange={editor.handleSourceChange}
          onKeyDown={editor.handleKeyDown}
          onBlur={editor.handleSourceBlur}
          onGenerate={editor.handleGenerateCode}
          onOpenImageModal={editor.openImageModal}
          onLoadTemplate={editor.loadTemplate}
        />
        <OutputPanel
          tabs={editor.tabs}
          selectedTab={editor.selectedTab}
          status={editor.status}
          currentTabContent={editor.currentTabContent}
          onSelectTab={editor.setSelectedTab}
          onCopy={editor.handleCopy}
        />
      </div>

      <ImageUploadModal
        open={editor.isImageModalOpen}
        onClose={editor.closeImageModal}
        onGenerate={editor.generateFromImage}
      />
    </DashboardLayout>
  );
}
