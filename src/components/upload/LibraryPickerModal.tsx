import { useState } from "react";
import { Modal } from "./Modal";
import { CheckIcon, FileIcon } from "./icons";
import type { LibraryItem } from "./libraryItems";
import { formatBytes } from "./types";

interface LibraryPickerModalProps {
  items: LibraryItem[];
  multiple: boolean;
  maxSelectable: number;
  onClose: () => void;
  onConfirm: (items: LibraryItem[]) => void;
}

export function LibraryPickerModal({ items, multiple, maxSelectable, onClose, onConfirm }: LibraryPickerModalProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (!multiple) return [id];
      if (prev.length >= maxSelectable) return prev;
      return [...prev, id];
    });
  }

  return (
    <Modal
      title="Select from library"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[13px] font-medium transition-colors hover:bg-black/5"
            style={{ color: "var(--app-ink)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(items.filter((item) => selected.includes(item.id)))}
            disabled={selected.length === 0}
            className="rounded-full px-4 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-40"
            style={{ background: "var(--app-ink)" }}
          >
            Add {selected.length > 0 ? `${selected.length} ` : ""}file{selected.length === 1 ? "" : "s"}
          </button>
        </>
      }
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px]" style={{ color: "var(--app-muted)" }}>
          Everything in your library has already been added.
        </p>
      ) : (
        <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
          {items.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className="flex items-center gap-2 rounded-xl border-2 p-2 text-left transition-colors"
                style={{ borderColor: isSelected ? "var(--app-ink)" : "var(--app-line)" }}
              >
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg"
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
    </Modal>
  );
}
