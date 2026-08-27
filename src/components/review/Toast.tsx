interface ToastProps {
  text: string | null;
}

export function Toast({ text }: ToastProps) {
  return (
    <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center transition-opacity duration-200 ${text ? "opacity-100" : "opacity-0"}`}>
      {text && (
        <div className="rounded-full px-4 py-2 text-[13px] font-medium text-white shadow-lg" style={{ background: "var(--app-ink)" }}>
          {text}
        </div>
      )}
    </div>
  );
}
