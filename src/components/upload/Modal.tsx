import { useEffect, type ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl p-5"
        style={{ background: "var(--app-bg)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--app-ink)" }}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded-full text-lg leading-none transition-colors hover:bg-black/5"
            style={{ color: "var(--app-muted)" }}
          >
            ×
          </button>
        </div>
        {children}
        <div className="flex items-center justify-end gap-2 pt-1">{footer}</div>
      </div>
    </div>
  );
}
