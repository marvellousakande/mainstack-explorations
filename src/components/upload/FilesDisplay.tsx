import { useEffect, useState, type MouseEvent } from "react";
import { FileRow } from "./FileRow";
import { FloatingMenu } from "./FloatingMenu";
import { ImagePlusIcon, MoreIcon, TrashIcon } from "./icons";
import type { UploadedFile } from "./types";

interface FilesDisplayProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
  /** "gallery" = hero + filmstrip (cover image). "list" = plain rows (product file). */
  variant: "gallery" | "list";
  /** Gallery only: shows a trailing "+" tile in the filmstrip when there's room for more. */
  canAddMore?: boolean;
  onAddFromDevice?: () => void;
  onAddFromLibrary?: () => void;
}

type OpenMenu = { type: "add"; rect: DOMRect } | { type: "more"; fileId: string; rect: DOMRect };

/**
 * Renders files already committed via the review modal's Submit — by
 * the time they land here they've finished "uploading", so this is
 * purely a browse/manage view, not part of the upload step itself.
 */
export function FilesDisplay({ files, onRemove, variant, canAddMore, onAddFromDevice, onAddFromLibrary }: FilesDisplayProps) {
  const [activeId, setActiveId] = useState<string | null>(files[0]?.id ?? null);
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);

  useEffect(() => {
    if (!files.some((file) => file.id === activeId)) setActiveId(files[0]?.id ?? null);
  }, [files, activeId]);

  if (files.length === 0) return null;

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-2">
        {files.map((file) => (
          <FileRow key={file.id} file={file} onRemove={() => onRemove(file.id)} />
        ))}
      </div>
    );
  }

  const activeImage = files.find((file) => file.id === activeId) ?? files[0];

  function toggleAddMenu(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setOpenMenu((prev) => (prev?.type === "add" ? null : { type: "add", rect }));
  }

  function toggleMoreMenu(fileId: string, event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setOpenMenu((prev) => (prev?.type === "more" && prev.fileId === fileId ? null : { type: "more", fileId, rect }));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl" style={{ background: "var(--app-line)" }}>
        <img src={activeImage.previewUrl ?? undefined} alt="" className="aspect-[4/3] w-full object-cover" />
        <button
          type="button"
          onClick={() => onRemove(activeImage.id)}
          aria-label="Delete photo"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow"
          style={{ background: "rgba(255,255,255,0.92)", color: "var(--app-muted)" }}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {files.map((file) => {
          const isActive = file.id === activeImage.id;
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

              {isActive ? (
                <button
                  type="button"
                  onClick={() => onRemove(file.id)}
                  aria-label={`Delete ${file.name}`}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full shadow"
                  style={{ background: "rgba(255,255,255,0.92)", color: "var(--app-muted)" }}
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              ) : (
                <button
                  type="button"
                  data-menu-trigger
                  onClick={(event) => toggleMoreMenu(file.id, event)}
                  aria-label={`More options for ${file.name}`}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full shadow"
                  style={{ background: "rgba(255,255,255,0.92)", color: "var(--app-muted)" }}
                >
                  <MoreIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {canAddMore && (
          <div className="relative h-20 w-20 shrink-0">
            <button
              type="button"
              data-menu-trigger
              onClick={toggleAddMenu}
              aria-label="Add another photo"
              className="grid h-full w-full place-items-center rounded-xl border-2 border-dashed transition-colors hover:bg-black/[0.02]"
              style={{ borderColor: "var(--app-line-strong)", color: "var(--app-muted)" }}
            >
              <ImagePlusIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {openMenu?.type === "add" && (
        <FloatingMenu anchorRect={openMenu.rect} onClose={() => setOpenMenu(null)} align="left">
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              onAddFromDevice?.();
            }}
            className="px-3 py-2 text-left transition-colors hover:bg-black/5"
            style={{ color: "var(--app-ink)" }}
          >
            Upload from device
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              onAddFromLibrary?.();
            }}
            className="px-3 py-2 text-left transition-colors hover:bg-black/5"
            style={{ color: "var(--app-ink)" }}
          >
            Select from library
          </button>
        </FloatingMenu>
      )}

      {openMenu?.type === "more" && (
        <FloatingMenu anchorRect={openMenu.rect} onClose={() => setOpenMenu(null)} align="right">
          <button
            type="button"
            onClick={() => {
              setActiveId(openMenu.fileId);
              setOpenMenu(null);
            }}
            className="px-3 py-2 text-left transition-colors hover:bg-black/5"
            style={{ color: "var(--app-ink)" }}
          >
            Set as cover
          </button>
          <button
            type="button"
            onClick={() => {
              onRemove(openMenu.fileId);
              setOpenMenu(null);
            }}
            className="px-3 py-2 text-left transition-colors hover:bg-black/5"
            style={{ color: "var(--app-ink)" }}
          >
            Delete
          </button>
        </FloatingMenu>
      )}
    </div>
  );
}
