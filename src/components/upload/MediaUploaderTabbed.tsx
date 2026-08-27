import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileRow } from "./FileRow";
import { Modal } from "./Modal";
import { Thumbnail } from "./Thumbnail";
import { FileIcon, UploadIcon } from "./icons";
import { simulateUpload } from "./simulateUpload";
import { createUploadedFiles, revokeUploadedFiles, type UploadedFile } from "./types";

export interface MediaUploaderTabbedProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  dropzoneLabel?: string;
  dropzoneHint?: string;
  onPickerOpen?: () => void;
  onFilesPicked?: (files: UploadedFile[]) => void;
  onSubmit?: (files: UploadedFile[]) => void;
  onCancel?: (discardedCount: number) => void;
}

type ReviewTab = "files" | "library";

const LIBRARY_PLACEHOLDER = ["Product shot.jpg", "Cover art.png", "Banner.jpg", "Thumbnail.png"];

/**
 * Exploration: same one-click-to-picker flow as MediaUploader, but the
 * review modal has two tabs — "Selected files" (what you just picked,
 * still functional) and "File library" (a placeholder for browsing
 * previously uploaded files; not wired up yet, switching to it is
 * non-destructive to whatever you've already selected).
 */
export function MediaUploaderTabbed({
  value,
  onChange,
  accept = "image/*,video/*",
  multiple = true,
  dropzoneLabel = "Upload your files here",
  dropzoneHint = "PNG, JPG, MP4 up to 50MB",
  onPickerOpen,
  onFilesPicked,
  onSubmit,
  onCancel,
}: MediaUploaderTabbedProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewTab>("files");
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
    setActiveTab("files");
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
          <span className="text-[13px] font-medium">{dropzoneLabel}</span>
          <span className="text-[12px]" style={{ color: "var(--app-muted)" }}>
            or <span className="underline">browse</span> · {dropzoneHint}
          </span>
        </button>
      </div>

      <input ref={inputRef} type="file" multiple={multiple} accept={accept} onChange={handleFileChange} className="hidden" />

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
          <div className="flex gap-1 self-start rounded-full p-1" style={{ background: "var(--app-line)" }}>
            <button
              type="button"
              onClick={() => setActiveTab("files")}
              aria-pressed={activeTab === "files"}
              className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={activeTab === "files" ? { background: "var(--app-bg)", color: "var(--app-ink)", boxShadow: "0 1px 2px rgba(18,24,31,0.12)" } : { color: "var(--app-muted)" }}
            >
              Selected files{pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ""}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("library")}
              aria-pressed={activeTab === "library"}
              className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={activeTab === "library" ? { background: "var(--app-bg)", color: "var(--app-ink)", boxShadow: "0 1px 2px rgba(18,24,31,0.12)" } : { color: "var(--app-muted)" }}
            >
              File library
            </button>
          </div>

          {activeTab === "files" ? (
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
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {LIBRARY_PLACEHOLDER.map((name) => (
                  <div
                    key={name}
                    className="flex cursor-not-allowed items-center gap-2 rounded-xl border p-2 opacity-50"
                    style={{ borderColor: "var(--app-line)" }}
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: "var(--app-line)", color: "var(--app-muted)" }}>
                      <FileIcon className="h-4 w-4" />
                    </div>
                    <span className="truncate text-[12px]" style={{ color: "var(--app-ink)" }}>
                      {name}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-center text-[12px]" style={{ color: "var(--app-muted)" }}>
                Browsing your library isn't wired up in this exploration yet.
              </p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
