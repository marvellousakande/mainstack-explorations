import type { ReactNode } from "react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileRow } from "./FileRow";
import { FilesDisplay } from "./FilesDisplay";
import { LibraryPickerModal } from "./LibraryPickerModal";
import { Modal } from "./Modal";
import { UploadEntryPoint } from "./UploadEntryPoint";
import { libraryItemToUploadedFile, type LibraryItem } from "./libraryItems";
import { simulateUpload } from "./simulateUpload";
import { createUploadedFiles, revokeUploadedFiles, type UploadedFile } from "./types";

export interface MediaUploaderProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  variant?: "gallery" | "list";
  icon: ReactNode;
  maxFiles?: number;
  dropzoneLabel?: string;
  dropzoneHint?: string;
  libraryItems?: LibraryItem[];
  onLibraryClick?: () => void;
  /** Lifecycle hooks — optional, useful for telemetry. None of them are required to use the component. */
  onPickerOpen?: () => void;
  onFilesPicked?: (files: UploadedFile[]) => void;
  onSubmit?: (files: UploadedFile[]) => void;
  onCancel?: (discardedCount: number) => void;
}

/**
 * Fixed upload flow: the device file picker opens on the first click of
 * the (always-visible) "Upload from device" button. The review modal
 * (with remove / add more / submit) only appears once files have
 * actually been picked, so nothing sits between the click and the OS
 * dialog. Submitting shows per-file upload progress before the files
 * land in the grid.
 */
export function MediaUploader({
  value,
  onChange,
  accept = "image/*,video/*",
  multiple = true,
  variant = "list",
  icon,
  maxFiles = 5,
  dropzoneLabel = "Upload your files here",
  dropzoneHint = "PNG, JPG, MP4 up to 50MB",
  libraryItems = [],
  onLibraryClick,
  onPickerOpen,
  onFilesPicked,
  onSubmit,
  onCancel,
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number> | null>(null);
  const cancelUploadRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelUploadRef.current?.(), []);

  function openPicker() {
    onPickerOpen?.();
    inputRef.current?.click();
  }

  function openLibrary() {
    onLibraryClick?.();
    setIsLibraryOpen(true);
  }

  function handleLibraryConfirm(items: LibraryItem[]) {
    onChange([...value, ...items.map(libraryItemToUploadedFile)]);
    setIsLibraryOpen(false);
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

  const canAddMore = value.length < maxFiles;
  const availableLibraryItems = libraryItems.filter((item) => !value.some((file) => file.name === item.name));

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <FilesDisplay
          files={value}
          onRemove={removeUploaded}
          variant={variant}
          canAddMore={variant === "gallery" && canAddMore}
          onAddFromDevice={openPicker}
          onAddFromLibrary={openLibrary}
        />
      )}

      {canAddMore && (variant === "list" || value.length === 0) && (
        <UploadEntryPoint
          icon={icon}
          label={dropzoneLabel}
          hint={`${dropzoneHint} You can add up to ${maxFiles}.`}
          compact={value.length > 0}
          onDeviceClick={openPicker}
          onLibraryClick={openLibrary}
        />
      )}

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

      {isLibraryOpen && (
        <LibraryPickerModal
          items={availableLibraryItems}
          multiple={multiple}
          maxSelectable={maxFiles - value.length}
          onClose={() => setIsLibraryOpen(false)}
          onConfirm={handleLibraryConfirm}
        />
      )}
    </div>
  );
}
