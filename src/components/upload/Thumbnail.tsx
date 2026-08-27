import { FileIcon } from "./icons";
import { truncateName, type UploadedFile } from "./types";

interface ThumbnailProps {
  file: UploadedFile;
  onRemove: () => void;
}

export function Thumbnail({ file, onRemove }: ThumbnailProps) {
  return (
    <div
      className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--app-line)", background: "var(--app-bg)" }}
    >
      {file.previewUrl ? (
        <img src={file.previewUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-1.5 p-2 text-center" style={{ color: "var(--app-muted)" }}>
          <FileIcon className="h-5 w-5" />
          <span className="text-[11px] leading-tight">{truncateName(file.name, 16)}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-sm leading-none text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
