import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const REASONS = [
  "Inappropriate behaviour",
  "Nudity or sexual content",
  "Hate speech or harassment",
  "Spam or bot",
  "Underage user",
  "Other",
];

export function ReportModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => {
    setReason("");
    setDetails("");
    setSubmitting(false);
    setDone(false);
  };

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    onSubmit(reason, details);
    // fire to REST too
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
    } catch {
      /* best-effort */
    }
    setSubmitting(false);
    setDone(true);
    setTimeout(() => {
      onClose();
      reset();
    }, 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        reset();
      }}
      title={done ? undefined : "Report this user"}
      size="sm"
    >
      {done ? (
        <div className="flex flex-col items-center text-center py-8">
          <motion.div
            className="grid place-items-center rounded-full mb-4"
            style={{ width: 64, height: 64, background: "rgba(34,197,94,0.14)" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 12 }}
          >
            <Check size={32} color="#22c55e" />
          </motion.div>
          <p className="text-white font-semibold">Report submitted</p>
          <p className="text-sm text-[var(--sl-white-dim)] mt-1">Thank you for keeping StrangerLink safe.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm"
              style={{
                background: reason === r ? "rgba(37,99,235,0.14)" : "transparent",
                color: reason === r ? "#fff" : "var(--sl-white-muted)",
                border: `1px solid ${reason === r ? "var(--sl-accent)" : "var(--sl-border)"}`,
                transition: "var(--sl-t-fast)",
              }}
            >
              <span
                className="grid place-items-center rounded-full shrink-0"
                style={{ width: 16, height: 16, border: `2px solid ${reason === r ? "var(--sl-accent)" : "var(--sl-border)"}` }}
              >
                {reason === r && <span className="rounded-full" style={{ width: 7, height: 7, background: "var(--sl-accent)" }} />}
              </span>
              {r}
            </button>
          ))}

          <AnimatePresence>
            {reason === "Other" && (
              <motion.textarea
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Tell us what happened…"
                rows={3}
                className="sl-scroll w-full mt-1 px-3 py-2 rounded-xl text-sm resize-none outline-none"
                style={{ background: "var(--sl-surface)", border: "1px solid var(--sl-border)", color: "#fff" }}
              />
            )}
          </AnimatePresence>

          <Button variant="danger" fullWidth className="mt-3" loading={submitting} disabled={!reason} onClick={handleSubmit}>
            Submit Report
          </Button>
        </div>
      )}
    </Modal>
  );
}

export default ReportModal;
