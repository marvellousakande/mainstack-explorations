import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { DeviceIcon, ImagePlusIcon, MoreIcon, TrashIcon, UploadIcon } from "./icons";
import { simulateUpload } from "./simulateUpload";
import { createUploadedFiles, type UploadedFile } from "./types";

export interface ImageGalleryUploaderProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxPhotos?: number;
  onLibraryClick?: () => void;
  onCapacityExceeded?: (allowed: number) => void;
}

/**
 * Matches the real product-images pattern: both entry points sit on the
 * page (no click-to-reveal step), and picked files land straight into a
 * hero + filmstrip gallery with inline per-photo upload progress —
 * there's no separate review/submit step.
 */
export function ImageGalleryUploader({ value, onChange, maxPhotos = 5, onLibraryClick, onCapacityExceeded }: ImageGalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeId, setActiveId] = useState<string | null>(value[0]?.id ?? null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const cancelUploadsRef = useRef<(() => void)[]>([]);

  useEffect(() => () => cancelUploadsRef.current.forEach((cancel) => cancel()), []);

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const remaining = maxPhotos - value.length;
    const list = Array.from(files).slice(0, Math.max(0, remaining));
    event.target.value = "";
    if (list.length === 0) return;
    if (files.length > list.length) onCapacityExceeded?.(maxPhotos);

    const picked = createUploadedFiles(dataTransferFrom(list));
    onChange([...value, ...picked]);
    if (!activeId) setActiveId(picked[0].id);

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

  function removeImage(id: string) {
    const target = value.find((file) => file.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    const next = value.filter((file) => file.id !== id);
    onChange(next);
    setOpenMenuId(null);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  }

  const activeImage = value.find((file) => file.id === activeId) ?? value[0] ?? null;

  if (value.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center"
          style={{ borderColor: "var(--app-line-strong)" }}
        >
          <ImagePlusIcon className="h-8 w-8 text-[var(--app-ink)]" />
          <p className="text-[15px] font-semibold" style={{ color: "var(--app-ink)" }}>
            Drop your product images here.
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: "var(--app-muted)" }}>
            1600 × 1200 (4:3) recommended, up to 10MB each. You can add up to {maxPhotos} photos.
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

        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: maxPhotos }).map((_, i) => (
            <div
              key={i}
              className="grid aspect-square place-items-center rounded-xl border-2 border-dashed"
              style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
            >
              <ImagePlusIcon className="h-5 w-5 opacity-40" />
            </div>
          ))}
        </div>

        <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>
    );
  }

  const activeProgress = activeImage ? uploadProgress[activeImage.id] : undefined;

  return (
    <div className="flex flex-col gap-3">
      {activeImage && (
        <div className="relative overflow-hidden rounded-2xl" style={{ background: "var(--app-line)" }}>
          <img src={activeImage.previewUrl ?? undefined} alt="" className="aspect-[4/3] w-full object-cover" />
          {activeProgress != null ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-[13px] font-medium text-white">
              Uploading… {Math.round(activeProgress)}%
            </div>
          ) : (
            <button
              type="button"
              onClick={() => removeImage(activeImage.id)}
              aria-label="Delete photo"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-[var(--app-muted)] shadow transition-colors hover:text-[#c0392b]"
              style={{ background: "rgba(255,255,255,0.92)" }}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-1">
        {value.map((file) => {
          const progress = uploadProgress[file.id];
          const isActive = file.id === activeId;
          return (
            <div key={file.id} className="relative h-20 w-20 shrink-0">
              <button
                type="button"
                onClick={() => setActiveId(file.id)}
                className="h-full w-full overflow-hidden rounded-xl border-2 transition-colors"
                style={{ borderColor: isActive ? "var(--app-ink)" : "transparent" }}
              >
                <img src={file.previewUrl ?? undefined} alt="" className="h-full w-full object-cover" />
              </button>

              {progress != null ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 text-[11px] font-medium text-white">
                  {Math.round(progress)}%
                </div>
              ) : isActive ? (
                <button
                  type="button"
                  onClick={() => removeImage(file.id)}
                  aria-label={`Delete ${file.name}`}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full shadow"
                  style={{ background: "rgba(255,255,255,0.92)", color: "var(--app-muted)" }}
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              ) : (
                <div className="absolute right-1 top-1">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId((prev) => (prev === file.id ? null : file.id))}
                    aria-label={`More options for ${file.name}`}
                    className="grid h-6 w-6 place-items-center rounded-full shadow"
                    style={{ background: "rgba(255,255,255,0.92)", color: "var(--app-muted)" }}
                  >
                    <MoreIcon className="h-3.5 w-3.5" />
                  </button>
                  {openMenuId === file.id && (
                    <div
                      className="absolute right-0 top-7 z-10 flex w-32 flex-col overflow-hidden rounded-lg border text-left text-[12px]"
                      style={{ borderColor: "var(--app-line)", background: "var(--app-bg)", boxShadow: "var(--shadow-card)" }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveId(file.id);
                          setOpenMenuId(null);
                        }}
                        className="px-3 py-2 text-left transition-colors hover:bg-black/5"
                        style={{ color: "var(--app-ink)" }}
                      >
                        Set as cover
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(file.id)}
                        className="px-3 py-2 text-left transition-colors hover:bg-black/5"
                        style={{ color: "var(--app-ink)" }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {value.length < maxPhotos && (
          <button
            type="button"
            onClick={openPicker}
            aria-label="Add another photo"
            className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border-2 border-dashed transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: "var(--app-line-strong)", color: "var(--app-muted)" }}
          >
            <ImagePlusIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}

function dataTransferFrom(files: File[]): FileList {
  const dt = new DataTransfer();
  files.forEach((file) => dt.items.add(file));
  return dt.files;
}
