import { useRef, useState } from "react";
import { Toast } from "./components/review/Toast";
import { ChevronLeftIcon, FileIcon, ImagePlusIcon } from "./components/upload/icons";
import { FILE_LIBRARY, IMAGE_LIBRARY } from "./components/upload/libraryItems";
import { MediaUploader } from "./components/upload/MediaUploader";
import { MediaUploaderLegacy } from "./components/upload/MediaUploaderLegacy";
import { MediaUploaderTabbed } from "./components/upload/MediaUploaderTabbed";
import { revokeUploadedFiles, type UploadedFile } from "./components/upload/types";
import type { Mode } from "./lib/mode";

const MODE_LABEL: Record<Mode, string> = {
  current: "Current",
  fixed: "Fixed",
  tabbed: "Tabbed",
};

function App() {
  const [mode, setMode] = useState<Mode>("fixed");
  const [clicksToPicker, setClicksToPicker] = useState<number | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [coverFiles, setCoverFiles] = useState<UploadedFile[]>([]);
  const [productFiles, setProductFiles] = useState<UploadedFile[]>([]);
  const [toastText, setToastText] = useState<string | null>(null);

  const toastTimerRef = useRef<number | undefined>(undefined);

  function showToast(text: string) {
    setToastText(text);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastText(null), 2400);
  }

  function handleModeChange(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setClicksToPicker(null);
    setResetKey((k) => k + 1);
  }

  function handleReset() {
    revokeUploadedFiles(coverFiles);
    revokeUploadedFiles(productFiles);
    setCoverFiles([]);
    setProductFiles([]);
    setClicksToPicker(null);
    setResetKey((k) => k + 1);
    showToast("Reset");
  }

  const plural = (n: number) => (n === 1 ? "" : "s");

  const coverProps = {
    icon: <ImagePlusIcon className="h-8 w-8 text-[var(--app-ink)]" />,
    variant: "gallery" as const,
    maxFiles: 5,
    accept: "image/*",
    multiple: true,
    dropzoneLabel: "Drop your product images here.",
    dropzoneHint: "1600 × 1200 (4:3) recommended, up to 10MB each.",
    libraryItems: IMAGE_LIBRARY,
    onSubmit: () => showToast("Cover image uploaded"),
  };

  const productProps = {
    icon: <FileIcon className="h-8 w-8 text-[var(--app-ink)]" />,
    variant: "list" as const,
    maxFiles: 3,
    accept: ".pdf,.zip,.doc,.docx,.epub,application/pdf,application/zip",
    dropzoneLabel: "Drop your product file here.",
    dropzoneHint: "PDF, ZIP or DOCX, up to 500MB.",
    libraryItems: FILE_LIBRARY,
    onSubmit: (files: UploadedFile[]) => showToast(`${files.length} product file${plural(files.length)} uploaded`),
  };

  return (
    <div className="min-h-svh">
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
              Product uploads
            </h1>
            <p className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
              "Upload from device" and "Select from library" are the standard everywhere. Current/Fixed/Tabbed only changes what
              happens after you click.
            </p>
          </div>
          <button type="button" onClick={handleReset} className="shrink-0 text-[12px] underline underline-offset-2" style={{ color: "var(--ink-faint)" }}>
            Reset
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full border" style={{ borderColor: "var(--line-strong)" }}>
            {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className="px-3.5 py-1.5 text-[13px] font-medium transition-colors"
                style={mode === m ? { background: "var(--ink)", color: "var(--paper)" } : { color: "var(--ink-soft)" }}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>

          {mode === "current" || mode === "fixed" ? (
            <span className="text-[12px]" style={{ color: "var(--ink-faint)" }}>
              clicks to open file picker: <strong style={{ color: "var(--ink)" }}>{clicksToPicker ?? "—"}</strong>
            </span>
          ) : null}
        </div>

        <section className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--app-line)", background: "var(--app-bg)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--app-line)" }}>
            <div className="flex items-center gap-2" style={{ color: "var(--app-ink)" }}>
              <ChevronLeftIcon className="h-4 w-4 text-[var(--app-muted)]" />
              <span className="text-[14px] font-medium">Create digital product</span>
            </div>
            <button type="button" className="rounded-full px-4 py-1.5 text-[13px] font-medium text-white" style={{ background: "var(--app-ink)" }}>
              Publish
            </button>
          </div>

          <div className="flex flex-col gap-6 px-5 py-5">
            <div className="flex flex-col gap-3">
              <h2 className="text-[13px] font-semibold" style={{ color: "var(--app-ink)" }}>
                Basic details
              </h2>
              <label className="flex flex-col gap-1">
                <span className="text-[12px]" style={{ color: "var(--app-muted)" }}>
                  Product name
                </span>
                <input
                  readOnly
                  value="Guide to eating clean"
                  className="rounded-lg border px-3 py-2 text-[13px]"
                  style={{ borderColor: "var(--app-line)", color: "var(--app-ink)", background: "var(--app-bg)" }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px]" style={{ color: "var(--app-muted)" }}>
                  Product URL
                </span>
                <input
                  readOnly
                  value="mainstack.co/guide-to-eating-clean"
                  className="rounded-lg border px-3 py-2 text-[13px]"
                  style={{ borderColor: "var(--app-line)", color: "var(--app-ink)", background: "var(--app-bg)" }}
                />
                <span className="text-[12px]" style={{ color: "var(--app-success-text)" }}>
                  ✓ This URL is available for use
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-[13px] font-semibold" style={{ color: "var(--app-ink)" }}>
                  Media
                </h2>
                <p className="text-[12px]" style={{ color: "var(--app-muted)" }}>
                  This becomes your product's cover — the default image shown before someone buys.
                </p>
              </div>

              {mode === "current" ? (
                <MediaUploaderLegacy
                  key={`cover-current-${resetKey}`}
                  value={coverFiles}
                  onChange={setCoverFiles}
                  onModalOpen={() => setClicksToPicker(1)}
                  onPickerOpen={() => setClicksToPicker(2)}
                  {...coverProps}
                />
              ) : mode === "tabbed" ? (
                <MediaUploaderTabbed key={`cover-tabbed-${resetKey}`} value={coverFiles} onChange={setCoverFiles} {...coverProps} />
              ) : (
                <MediaUploader
                  key={`cover-fixed-${resetKey}`}
                  value={coverFiles}
                  onChange={setCoverFiles}
                  onPickerOpen={() => setClicksToPicker(1)}
                  {...coverProps}
                />
              )}
            </div>

            <div className="flex flex-col gap-3 border-t pt-6" style={{ borderColor: "var(--app-line)" }}>
              <div>
                <h2 className="text-[13px] font-semibold" style={{ color: "var(--app-ink)" }}>
                  File
                </h2>
                <p className="text-[12px]" style={{ color: "var(--app-muted)" }}>
                  The actual product — this is what customers get after they pay.
                </p>
              </div>

              {mode === "current" ? (
                <MediaUploaderLegacy
                  key={`product-current-${resetKey}`}
                  value={productFiles}
                  onChange={setProductFiles}
                  onModalOpen={() => setClicksToPicker(1)}
                  onPickerOpen={() => setClicksToPicker(2)}
                  {...productProps}
                />
              ) : mode === "tabbed" ? (
                <MediaUploaderTabbed key={`product-tabbed-${resetKey}`} value={productFiles} onChange={setProductFiles} {...productProps} />
              ) : (
                <MediaUploader
                  key={`product-fixed-${resetKey}`}
                  value={productFiles}
                  onChange={setProductFiles}
                  onPickerOpen={() => setClicksToPicker(1)}
                  {...productProps}
                />
              )}
            </div>
          </div>
        </section>
      </main>

      <Toast text={toastText} />
    </div>
  );
}

export default App;
