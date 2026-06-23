import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

type Size = "sm" | "md" | "lg";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  size?: Size;
  closeOnBackdrop?: boolean;
  hideClose?: boolean;
}

const sizeWidth: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnBackdrop = true,
  hideClose = false,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={() => closeOnBackdrop && onClose?.()}
        >
          <motion.div
            className={`sl-modal-panel relative w-full ${sizeWidth[size]} sm:rounded-[20px] rounded-none h-full sm:h-auto`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--sl-card)",
              border: "1px solid var(--sl-border)",
              boxShadow: "var(--sl-shadow-glow-lg)",
            }}
          >
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <h3 className="text-[18px] font-semibold text-white">{title}</h3>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="sl-modal-x grid place-items-center w-8 h-8 rounded-full text-[var(--sl-white-dim)]"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
            <div className="px-6 pb-6 sl-scroll overflow-y-auto">{children}</div>
            <style>{`
              .sl-modal-x { transition: var(--sl-t-fast); }
              .sl-modal-x:hover { color: var(--sl-glow); box-shadow: var(--sl-shadow-glow); background: rgba(37,99,235,0.12); }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default Modal;
