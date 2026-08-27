import type { ReactNode } from "react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileRow } from "./FileRow";
import { FilesDisplay } from "./FilesDisplay";
import { LibraryPickerModal } from "./LibraryPickerModal";
import { Modal } from "./Modal";
import { UploadEntryPoint } from "./UploadEntryPoint";
import { CheckIcon, FileIcon } from "./icons";
import { libraryItemToUploadedFile, type LibraryItem } from "./libraryItems";
import { simulateUpload } from "./simulateUpload";
import { createUploadedFiles, formatBytes, revokeUploadedFiles, type UploadedFile } from "./types";

export interface MediaUploaderTabbedProps {
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
  onPickerOpen?: () => void;
  onFilesPicked?: (files: UploadedFile[]) => void;
  onSubmit?: (files: UploadedFile[]) => void;
  onCancel?: (discardedCount: number) => void;
}

type ReviewTab = "files" | "library";

/**
 * Exploration: same one-click-to-picker flow as MediaUploader, but the
 * review modal has two tabs — "Selected files" (what you just picked,
 * still functional) and "File library" (browse and add existing files
 * without leaving the modal; switching to it is non-destructive to
 * whatever you've already selected from device).
 */
export function MediaUploaderTabbed({
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
}: MediaUploaderTabbedProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewTab>("files");
  const [librarySelected, setLibrarySelected] = useState<string[]>([]);
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

  const availableLibraryItems = libraryItems.filter((item) => !value.some((file) => file.name === item.name));
  const remainingCapacity = maxFiles - value.length;

  function toggleLibrarySelection(id: string) {
    setLibrarySelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (!multiple) return [id];
      if (prev.length >= remainingCapacity) return prev;
      return [...prev, id];
    });
  }

  function handleAddFromLibraryTab() {
    const items = availableLibraryItems.filter((item) => librarySelected.includes(item.id));
    onChange([...value, ...items.map(libraryItemToUploadedFile)]);
    setLibrarySelected([]);
    // Don't close the modal — any pending device files are still mid-review
    // and shouldn't be discarded. Hop back to that tab so Submit still works.
    setActiveTab("files");
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

  const canAddMore = value.length < maxFiles;

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
            ) : activeTab === "library" ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab("files")}
                  className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors hover:bg-black/5"
                  style={{ color: "var(--app-ink)" }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleAddFromLibraryTab}
                  disabled={librarySelected.length === 0}
                  className="rounded-full px-4 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-40"
                  style={{ background: "var(--app-ink)" }}
                >
                  Add {librarySelected.length > 0 ? `${librarySelected.length} ` : ""}file{librarySelected.length === 1 ? "" : "s"}
                </button>
              </>
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
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {availableLibraryItems.length === 0 ? (
                <p className="py-6 text-center text-[13px]" style={{ color: "var(--app-muted)" }}>
                  Everything in your library has already been added.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableLibraryItems.map((item) => {
                    const isSelected = librarySelected.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleLibrarySelection(item.id)}
                        className="flex items-center gap-2 rounded-xl border-2 p-2 text-left transition-colors"
                        style={{ borderColor: isSelected ? "var(--app-ink)" : "var(--app-line)" }}
                      >
                        <div
                          className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg"
                          style={{ background: item.color ?? "var(--app-line)", color: "var(--app-muted)" }}
                        >
                          {item.kind === "file" && <FileIcon className="h-4 w-4" />}
                        </div>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[12px] font-medium" style={{ color: "var(--app-ink)" }}>
                            {item.name}
                          </span>
                          <span className="text-[11px]" style={{ color: "var(--app-muted)" }}>
                            {formatBytes(item.size)}
                          </span>
                        </span>
                        <span
                          className="grid h-4 w-4 shrink-0 place-items-center rounded-full border"
                          style={isSelected ? { background: "var(--app-ink)", borderColor: "var(--app-ink)" } : { borderColor: "var(--app-line-strong)" }}
                        >
                          {isSelected && <CheckIcon className="h-2.5 w-2.5 text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {isLibraryOpen && (
        <LibraryPickerModal
          items={availableLibraryItems}
          multiple={multiple}
          maxSelectable={remainingCapacity}
          onClose={() => setIsLibraryOpen(false)}
          onConfirm={handleLibraryConfirm}
        />
      )}
    </div>
  );
}
