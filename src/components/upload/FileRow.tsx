import { CheckIcon, FileIcon } from "./icons";
import { formatBytes, truncateName, type UploadedFile } from "./types";

interface FileRowProps {
  file: UploadedFile;
  onRemove: () => void;
  /** 0-100 while uploading, undefined/null before submit (shows the remove button instead). */
  progress?: number | null;
}

export function FileRow({ file, onRemove, progress }: FileRowProps) {
  const isUploading = progress != null;
  const isDone = isUploading && progress >= 100;

  return (
    <div className="flex items-center gap-3 rounded-xl border p-2" style={{ borderColor: "var(--app-line)" }}>
      <div
        className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg"
        style={{ background: "var(--app-line)", color: "var(--app-muted)" }}
      >
        {file.previewUrl ? (
          <img src={file.previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <FileIcon className="h-5 w-5" />
        )}
      </div>

      {isUploading ? (
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[13px] font-medium" style={{ color: "var(--app-ink)" }}>
              {truncateName(file.name)}
            </span>
            <span className="shrink-0 text-[11px]" style={{ color: isDone ? "var(--app-success-text)" : "var(--app-muted)" }}>
              {isDone ? "Uploaded" : `${Math.round(progress)}%`}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--app-line)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, background: isDone ? "var(--app-success-text)" : "var(--app-ink)", transition: "width 80ms linear" }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-medium" style={{ color: "var(--app-ink)" }}>
              {truncateName(file.name)}
            </span>
            <span className="text-[11px]" style={{ color: "var(--app-muted)" }}>
              {formatBytes(file.size)}
            </span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${file.name}`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-base leading-none transition-colors hover:bg-black/5"
            style={{ color: "var(--app-muted)" }}
          >
            ×
          </button>
        </>
      )}

      {isDone && (
        <span className="shrink-0" style={{ color: "var(--app-success-text)" }} aria-hidden="true">
          <CheckIcon className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
