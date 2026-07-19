import { Loader, Image as ImageIcon, FileDown, Code, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { TemplatesSelector } from './TemplatesSelector';
import type { SchemaTemplate } from '@/data/templates';

type InputPanelProps = {
  source: string;
  status: string;
  isReadyForGenerate: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onSourceChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  onGenerate: () => void;
  onOpenImageModal: () => void;
  inputError?: string | null;
  onLoadTemplate: (template: SchemaTemplate) => void;
};

export function InputPanel({
  source,
  status,
  isReadyForGenerate,
  textareaRef,
  onSourceChange,
  onKeyDown,
  onBlur,
  onGenerate,
  onOpenImageModal,
  inputError,
  onLoadTemplate,
}: InputPanelProps) {
  const [templatesOpen, setTemplatesOpen] = useState(false);
  return (
    <div className="flex min-h-[70vh] flex-col bg-[#131b2e] border border-[#171f33] rounded-lg overflow-hidden lg:min-h-0 lg:h-full lg:flex-1">
      <div className="bg-[#171f33] border-b border-[#222a3d] p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#c0c1ff] mb-1">Legacy Source</h2>
            <p className="hidden text-xs text-[#c7c4d7] sm:block">Paste legacy database schema or raw JSON objects here.</p>
          </div>
          <TemplatesSelector
            onTemplateSelect={onLoadTemplate}
            open={templatesOpen}
            onOpenChange={setTemplatesOpen}
          />
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={source}
        onChange={onSourceChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={`Paste your legacy schema or JSON here...

Example:
{
    "users": {
        "id": "integer",
        "name": "string",
        "email": "string",
        "created_at": "timestamp"
    }
}`}
        className="flex-1 p-4 bg-[#171f33] text-[#dae2fd] font-mono text-sm border-0 outline-none focus:ring-2 focus:ring-[#c0c1ff] focus:ring-offset-0 resize-none placeholder-[#464554]"
      />
      {inputError && (
        <div className="px-4 pt-1 pb-1">
          <p className="text-sm text-[#ffb4ab]">{inputError}</p>
        </div>
      )}

      {/* Actions: stack on mobile, right-aligned on larger screens */}
      <div className="flex w-full flex-col gap-2 px-4 pb-4 mt-4 sm:flex-row sm:justify-end sm:gap-3">
        <button
          onClick={onOpenImageModal}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-[#464554] px-4 py-2 text-sm font-medium text-[#dae2fd] transition-colors hover:border-[#c0c1ff] hover:text-[#c0c1ff] sm:w-auto"
        >
          <ImageIcon className="w-3 h-3" />
          Upload Image
        </button>
        <button
          onClick={onGenerate}
          disabled={status === 'loading' || !isReadyForGenerate || (inputError !== null && source.trim().length > 0)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#c0c1ff] px-4 py-2 text-sm font-medium text-[#1000a9] transition-colors hover:bg-[#8083ff] disabled:opacity-50 sm:w-auto"
        >
          {status === 'loading' && <Loader className="w-3 h-3 animate-spin" />}
          {status === 'loading' ? 'Generating…' : 'Generate Code'}
        </button>
      </div>
    </div>
  );
}
