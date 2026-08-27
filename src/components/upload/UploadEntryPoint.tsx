import type { ReactNode } from "react";
import { DeviceIcon, UploadIcon } from "./icons";

interface UploadEntryPointProps {
  icon: ReactNode;
  label: string;
  hint?: string;
  /** true once there are already files — shows just the two buttons, no big dropzone card. */
  compact?: boolean;
  onDeviceClick: () => void;
  onLibraryClick?: () => void;
}

/**
 * The standard entry point, used identically everywhere a file gets
 * picked: "Upload from device" and "Select from library" are always
 * both visible — never hidden behind an initial click.
 */
export function UploadEntryPoint({ icon, label, hint, compact, onDeviceClick, onLibraryClick }: UploadEntryPointProps) {
  const buttons = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={onDeviceClick}
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
  );

  if (compact) return buttons;

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center" style={{ borderColor: "var(--app-line-strong)" }}>
      {icon}
      <p className="text-[15px] font-semibold" style={{ color: "var(--app-ink)" }}>
        {label}
      </p>
      {hint && (
        <p className="max-w-xs text-[13px]" style={{ color: "var(--app-muted)" }}>
          {hint}
        </p>
      )}
      <div className="mt-1">{buttons}</div>
    </div>
  );
}
