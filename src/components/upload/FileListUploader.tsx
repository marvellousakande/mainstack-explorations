import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileRow } from "./FileRow";
import { DeviceIcon, FileIcon, UploadIcon } from "./icons";
import { simulateUpload } from "./simulateUpload";
import { createUploadedFiles, type UploadedFile } from "./types";

export interface FileListUploaderProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  maxFiles?: number;
  dropzoneLabel?: string;
  dropzoneHint?: string;
  onLibraryClick?: () => void;
  onCapacityExceeded?: (allowed: number) => void;
}

/**
 * Same logic as ImageGalleryUploader, adapted for non-image product
 * files: both entry points sit on the page, and picked files land
 * straight into the list with inline upload progress — no popup.
 */
export function FileListUploader({
  value,
  onChange,
  accept = "application/pdf,application/zip,.doc,.docx,.epub",
  maxFiles = 3,
  dropzoneLabel = "Drop your product file here.",
  dropzoneHint = "PDF, ZIP or DOCX, up to 500MB.",
  onLibraryClick,
  onCapacityExceeded,
}: FileListUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const cancelUploadsRef = useRef<(() => void)[]>([]);

  useEffect(() => () => cancelUploadsRef.current.forEach((cancel) => cancel()), []);

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const remaining = maxFiles - value.length;
    const list = Array.from(files).slice(0, Math.max(0, remaining));
    event.target.value = "";
    if (list.length === 0) return;
    if (files.length > list.length) onCapacityExceeded?.(maxFiles);

    const picked = createUploadedFiles(dataTransferFrom(list));
    onChange([...value, ...picked]);

    const cancel = simulateUpload(
      picked.map((file) => file.id),
      (progress) => setUploadProgress((prev) => ({ ...prev, ...progress })),
      () => {
        setUploadProgress((prev) => {
          const next = { ...prev };
          for (const file of picked) delete next[file.id];
          return next;
        });
      },
    );
    cancelUploadsRef.current.push(cancel);
  }

  function removeFile(id: string) {
    const target = value.find((file) => file.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(value.filter((file) => file.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center"
          style={{ borderColor: "var(--app-line-strong)" }}
        >
          <FileIcon className="h-8 w-8 text-[var(--app-ink)]" />
          <p className="text-[15px] font-semibold" style={{ color: "var(--app-ink)" }}>
            {dropzoneLabel}
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: "var(--app-muted)" }}>
            {dropzoneHint} You can add up to {maxFiles} file{maxFiles === 1 ? "" : "s"}.
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={openPicker}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors hover:opacity-80"
              style={{ background: "var(--app-line)", color: "var(--app-ink)" }}
            >
              <DeviceIcon className="h-4 w-4" />
              Upload from device
            </button>
            <button
              type="button"
              onClick={() => onLibraryClick?.()}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors hover:opacity-80"
              style={{ background: "var(--app-line)", color: "var(--app-ink)" }}
            >
              <UploadIcon className="h-4 w-4" />
              Select from library
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {value.map((file) => (
              <FileRow key={file.id} file={file} onRemove={() => removeFile(file.id)} progress={uploadProgress[file.id]} />
            ))}
          </div>

          {value.length < maxFiles && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openPicker}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors hover:opacity-80"
                style={{ background: "var(--app-line)", color: "var(--app-ink)" }}
              >
                <DeviceIcon className="h-4 w-4" />
                Upload from device
              </button>
              <button
                type="button"
                onClick={() => onLibraryClick?.()}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors hover:opacity-80"
                style={{ background: "var(--app-line)", color: "var(--app-ink)" }}
              >
                <UploadIcon className="h-4 w-4" />
                Select from library
              </button>
            </div>
          )}
        </>
      )}

      <input ref={inputRef} type="file" multiple accept={accept} onChange={handleFileChange} className="hidden" />
    </div>
  );
}

function dataTransferFrom(files: File[]): FileList {
  const dt = new DataTransfer();
  files.forEach((file) => dt.items.add(file));
  return dt.files;
}
