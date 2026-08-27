import type { ReactNode } from "react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileRow } from "./FileRow";
import { FilesDisplay } from "./FilesDisplay";
import { Modal } from "./Modal";
import { UploadEntryPoint } from "./UploadEntryPoint";
import { UploadIcon } from "./icons";
import { simulateUpload } from "./simulateUpload";
import { createUploadedFiles, revokeUploadedFiles, type UploadedFile } from "./types";

export interface MediaUploaderLegacyProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  variant?: "gallery" | "list";
  icon: ReactNode;
  maxFiles?: number;
  dropzoneLabel?: string;
  dropzoneHint?: string;
  onModalOpen?: () => void;
  onPickerOpen?: () => void;
  onFilesPicked?: (files: UploadedFile[]) => void;
  onSubmit?: (files: UploadedFile[]) => void;
  onCancel?: (discardedCount: number) => void;
  onLibraryClick?: () => void;
}

/**
 * Reference-only: reproduces the CURRENT flow so it can be compared
 * side-by-side against MediaUploader. "Upload from device" and "Select
 * from library" are the standard entry buttons everywhere — but here,
 * clicking "Upload from device" opens an intermediate modal that itself
 * has its own "Upload from device" button, and the OS picker only opens
 * on that second click. Delete this file once the fix in MediaUploader
 * ships.
 */
export function MediaUploaderLegacy({
  value,
  onChange,
  accept = "image/*,video/*",
  multiple = true,
  variant = "list",
  icon,
  maxFiles = 5,
  dropzoneLabel = "Upload your files here",
  dropzoneHint = "PNG, JPG, MP4 up to 50MB",
  onModalOpen,
  onPickerOpen,
  onFilesPicked,
  onSubmit,
  onCancel,
  onLibraryClick,
}: MediaUploaderLegacyProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number> | null>(null);
  const cancelUploadRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelUploadRef.current?.(), []);

  function openIntro() {
    onModalOpen?.();
    setIsIntroOpen(true);
  }

  function openPickerFromIntro() {
    onPickerOpen?.();
    setIsIntroOpen(false);
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
    <div className="flex flex-col gap-3">
      {value.length > 0 && <FilesDisplay files={value} onRemove={removeUploaded} variant={variant} />}

      {value.length < maxFiles && (
        <UploadEntryPoint
          icon={icon}
          label={dropzoneLabel}
          hint={`${dropzoneHint} You can add up to ${maxFiles}.`}
          compact={value.length > 0}
          onDeviceClick={openIntro}
          onLibraryClick={onLibraryClick}
        />
      )}

      <input ref={inputRef} type="file" multiple={multiple} accept={accept} onChange={handleFileChange} className="hidden" />

      {isIntroOpen && (
        <Modal
          title="Upload Files"
          onClose={() => setIsIntroOpen(false)}
          footer={
            <>
              <button
                type="button"
                onClick={() => onLibraryClick?.()}
                className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors hover:bg-black/5"
                style={{ color: "var(--app-ink)" }}
              >
                Select from library
              </button>
              <button
                type="button"
                onClick={openPickerFromIntro}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-white"
                style={{ background: "var(--app-ink)" }}
              >
                Upload from device
              </button>
            </>
          }
        >
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center"
            style={{ borderColor: "var(--app-line-strong)" }}
          >
            <UploadIcon className="h-6 w-6 text-[var(--app-muted)]" />
            <p className="text-[13px] font-medium" style={{ color: "var(--app-ink)" }}>
              {dropzoneLabel}
            </p>
            <p className="text-[12px]" style={{ color: "var(--app-muted)" }}>
              or <span className="underline">browse</span> from your computer
            </p>
          </div>
        </Modal>
      )}

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
                  onClick={() => inputRef.current?.click()}
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
