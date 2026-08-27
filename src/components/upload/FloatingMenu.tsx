import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface FloatingMenuProps {
  /** Snapshot of the trigger button's rect, taken at click time. */
  anchorRect: DOMRect;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
}

/**
 * Renders via a portal to document.body with fixed positioning, so it
 * escapes any ancestor's overflow clipping — needed because a
 * horizontally-scrollable row (overflow-x: auto) forces overflow-y to
 * "auto" too per the CSS spec, which would otherwise clip a popover
 * that opens downward from a trigger inside that row.
 */
export function FloatingMenu({ anchorRect, onClose, children, align = "left" }: FloatingMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-menu-trigger]")) return;
      onClose();
    }
    function handleReposition() {
      onClose();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 flex w-40 flex-col overflow-hidden rounded-lg border text-left text-[12px]"
      style={{
        top: anchorRect.bottom + 4,
        ...(align === "right" ? { right: window.innerWidth - anchorRect.right } : { left: anchorRect.left }),
        borderColor: "var(--app-line)",
        background: "var(--app-bg)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
