import { useRef, useState } from "react";
import { Toast } from "./components/review/Toast";
import { ChevronLeftIcon } from "./components/upload/icons";
import { MediaUploader } from "./components/upload/MediaUploader";
import { MediaUploaderLegacy } from "./components/upload/MediaUploaderLegacy";
import { revokeUploadedFiles, type UploadedFile } from "./components/upload/types";
import type { Mode } from "./lib/mode";

function App() {
  const [mode, setMode] = useState<Mode>("fixed");
  const [clicksToPicker, setClicksToPicker] = useState<number | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<UploadedFile[]>([]);
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
    revokeUploadedFiles(mediaFiles);
    setMediaFiles([]);
    setClicksToPicker(null);
    setResetKey((k) => k + 1);
    showToast("Reset");
  }

  const plural = (n: number) => (n === 1 ? "" : "s");

  return (
    <div className="min-h-svh">
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
            Media upload
          </h1>
          <p className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
            Current vs. fixed: does the file picker open on the first click, or the second?
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full border" style={{ borderColor: "var(--line-strong)" }}>
            <button
              type="button"
              onClick={() => handleModeChange("current")}
              className="px-3.5 py-1.5 text-[13px] font-medium transition-colors"
              style={mode === "current" ? { background: "var(--ink)", color: "var(--paper)" } : { color: "var(--ink-soft)" }}
            >
              Current
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("fixed")}
              className="px-3.5 py-1.5 text-[13px] font-medium transition-colors"
              style={mode === "fixed" ? { background: "var(--ink)", color: "var(--paper)" } : { color: "var(--ink-soft)" }}
            >
              Fixed
            </button>
          </div>

          <span className="text-[12px]" style={{ color: "var(--ink-faint)" }}>
            clicks to open file picker: <strong style={{ color: "var(--ink)" }}>{clicksToPicker ?? "—"}</strong>
          </span>

          <button type="button" onClick={handleReset} className="ml-auto text-[12px] underline underline-offset-2" style={{ color: "var(--ink-faint)" }}>
            Reset
          </button>
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
                  Add images or files that showcase your product. Nothing here leaves your browser.
                </p>
              </div>

              {mode === "current" ? (
                <MediaUploaderLegacy
                  key={`current-${resetKey}`}
                  value={mediaFiles}
                  onChange={setMediaFiles}
                  onModalOpen={() => setClicksToPicker(1)}
                  onPickerOpen={() => setClicksToPicker(2)}
                  onSubmit={(files) => showToast(`${files.length} file${plural(files.length)} uploaded`)}
                  onLibraryClick={() => showToast("Library picker is unchanged — this covers the device-upload path.")}
                />
              ) : (
                <MediaUploader
                  key={`fixed-${resetKey}`}
                  value={mediaFiles}
                  onChange={setMediaFiles}
                  onPickerOpen={() => setClicksToPicker(1)}
                  onSubmit={(files) => showToast(`${files.length} file${plural(files.length)} uploaded`)}
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
