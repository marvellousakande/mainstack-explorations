import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileRow } from "./FileRow";
import { Modal } from "./Modal";
import { Thumbnail } from "./Thumbnail";
import { UploadIcon } from "./icons";
import { simulateUpload } from "./simulateUpload";
import { createUploadedFiles, revokeUploadedFiles, type UploadedFile } from "./types";

export interface MediaUploaderProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  /** Lifecycle hooks — optional, useful for telemetry. None of them are required to use the component. */
  onPickerOpen?: () => void;
  onFilesPicked?: (files: UploadedFile[]) => void;
  onSubmit?: (files: UploadedFile[]) => void;
  onCancel?: (discardedCount: number) => void;
}

/**
 * Fixed upload flow: the device file picker opens on the first click.
 * The review modal (with remove / add more / submit) only appears once
 * files have actually been picked, so nothing sits between the click and
 * the OS dialog. Submitting shows per-file upload progress before the
 * files land in the grid.
 */
export function MediaUploader({ value, onChange, accept = "image/*,video/*", onPickerOpen, onFilesPicked, onSubmit, onCancel }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number> | null>(null);
  const cancelUploadRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelUploadRef.current?.(), []);

  function openPicker() {
    onPickerOpen?.();
    inputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const picked = createUploadedFiles(files);
    event.target.value = "";
    onFilesPicked?.(picked);
    setPendingFiles((prev) => [...prev, ...picked]);
    setIsReviewOpen(true);
  }

  function removePending(id: string) {
    setPendingFiles((prev) => {
      const target = prev.find((file) => file.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((file) => file.id !== id);
    });
  }

  function closeReview() {
    if (uploadProgress) return;
    onCancel?.(pendingFiles.length);
    revokeUploadedFiles(pendingFiles);
    setPendingFiles([]);
    setIsReviewOpen(false);
  }

  function handleSubmit() {
    if (pendingFiles.length === 0 || uploadProgress) return;
    cancelUploadRef.current = simulateUpload(
      pendingFiles.map((file) => file.id),
      setUploadProgress,
      () => {
        onSubmit?.(pendingFiles);
        onChange([...value, ...pendingFiles]);
        setPendingFiles([]);
        setUploadProgress(null);
        setIsReviewOpen(false);
      },
    );
  }

  function removeUploaded(id: string) {
    const target = value.find((file) => file.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    onChange(value.filter((file) => file.id !== id));
  }

  const isUploading = uploadProgress != null;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((file) => (
          <Thumbnail key={file.id} file={file} onRemove={() => removeUploaded(file.id)} />
        ))}
        <button
          type="button"
          onClick={openPicker}
          className="col-span-3 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors hover:bg-black/[0.02] sm:col-span-4"
          style={{ borderColor: "var(--app-line-strong)", color: "var(--app-ink)" }}
        >
          <UploadIcon className="h-6 w-6 text-[var(--app-muted)]" />
          <span className="text-[13px] font-medium">Upload your files here</span>
          <span className="text-[12px]" style={{ color: "var(--app-muted)" }}>
            or <span className="underline">browse</span> · PNG, JPG, MP4 up to 50MB
          </span>
        </button>
      </div>

      <input ref={inputRef} type="file" multiple accept={accept} onChange={handleFileChange} className="hidden" />

      {isReviewOpen && (
        <Modal
          title="Upload Files"
          onClose={closeReview}
          footer={
            isUploading ? (
              <span className="text-[13px]" style={{ color: "var(--app-muted)" }}>
                Uploading {Object.values(uploadProgress).filter((p) => p >= 100).length} of {pendingFiles.length}…
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openPicker}
                  className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors hover:bg-black/5"
                  style={{ color: "var(--app-ink)" }}
                >
                  Add more
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={pendingFiles.length === 0}
                  className="rounded-full px-4 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-40"
                  style={{ background: "var(--app-ink)" }}
                >
                  Submit files
                </button>
              </>
            )
          }
        >
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {pendingFiles.length === 0 ? (
              <p className="py-6 text-center text-[13px]" style={{ color: "var(--app-muted)" }}>
                No files selected yet.
              </p>
            ) : (
              pendingFiles.map((file) => (
                <FileRow key={file.id} file={file} onRemove={() => removePending(file.id)} progress={uploadProgress?.[file.id]} />
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
