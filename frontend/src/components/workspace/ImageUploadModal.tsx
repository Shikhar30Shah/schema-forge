import { useRef, useState } from 'react';
import { Image as ImageIcon, Loader, UploadCloud, X } from 'lucide-react';

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

type ImageUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onGenerate: (imageBase64: string, mimeType: string) => Promise<void> | void;
};

type SelectedImage = {
  base64: string;
  mimeType: string;
  previewUrl: string;
  name: string;
};

export function ImageUploadModal({ open, onClose, onGenerate }: ImageUploadModalProps) {
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return null;
  }

  const reset = () => {
    setSelected(null);
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (file: File | undefined | null) => {
    setError(null);
    if (!file) {
      return;
    }

    if (!ACCEPTED.includes(file.type)) {
      setError('Unsupported file type. Use PNG, JPEG, or WEBP.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('Image is too large. Maximum size is 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] ?? '';
      setSelected({
        base64,
        mimeType: file.type,
        previewUrl: dataUrl,
        name: file.name,
      });
    };
    reader.onerror = () => setError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selected || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onGenerate(selected.base64, selected.mimeType);
      onClose();
      reset();
    } catch {
      setError('Generation failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={handleClose}>
      <div
        className="w-[min(560px,100%)] rounded-xl border border-[#171f33] bg-[#131b2e] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#c0c1ff]">Generate from Schema Image</h2>
          <button onClick={handleClose} className="text-[#c7c4d7] transition hover:text-[#dae2fd]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#c7c4d7]">
          Upload a screenshot or diagram of your database schema (ERD, table list, etc.). SchemaForge will read it and
          generate Mongoose models, Express routes, and validators.
        </p>

        {!selected ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFile(event.dataTransfer.files?.[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
              isDragging ? 'border-[#c0c1ff] bg-[#c0c1ff]/5' : 'border-[#222a3d] hover:border-[#c0c1ff]'
            }`}
          >
            <UploadCloud className="w-10 h-10 text-[#c0c1ff]" />
            <p className="text-sm font-medium text-[#dae2fd]">Click to upload or drag &amp; drop</p>
            <p className="text-xs text-[#c7c4d7]">PNG, JPEG, or WEBP · up to 8MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 rounded-lg border border-[#222a3d] bg-[#171f33] p-3">
              <ImageIcon className="w-8 h-8 shrink-0 text-[#c0c1ff]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#dae2fd]">{selected.name}</p>
                <p className="text-xs text-[#c7c4d7]">{selected.mimeType}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-[#c7c4d7] transition hover:text-[#ffb4ab]"
              >
                Remove
              </button>
            </div>
            <div className="max-h-48 overflow-hidden rounded-lg border border-[#222a3d]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.previewUrl} alt="Schema preview" className="w-full object-contain" />
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-[#ffb4ab]">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-md border border-[#222a3d] px-4 py-2 text-sm font-medium text-[#dae2fd] transition hover:border-[#c0c1ff] hover:text-[#c0c1ff]"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!selected || submitting}
            className="flex items-center gap-2 rounded-md bg-[#c0c1ff] px-4 py-2 text-sm font-semibold text-[#1000a9] transition hover:bg-[#8083ff] disabled:opacity-50"
          >
            {submitting && <Loader className="w-4 h-4 animate-spin" />}
            {submitting ? 'Generating…' : 'Generate from Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
