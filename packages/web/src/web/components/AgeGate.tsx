import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import Button from "./ui/Button";

const COOKIE = "sl_age_confirmed";

export function isAgeConfirmed() {
  return typeof document !== "undefined" && document.cookie.includes(`${COOKIE}=1`);
}

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [checked, setChecked] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const confirm = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    document.cookie = `${COOKIE}=1; expires=${d.toUTCString()}; path=/`;
    setLeaving(true);
    setTimeout(onConfirm, 300);
  };

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          className="fixed inset-0 z-[300] grid place-items-center p-6"
          style={{ background: "var(--sl-bg)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="w-full max-w-md p-8 rounded-[20px] text-center"
            style={{ background: "var(--sl-card)", border: "1px solid var(--sl-border)" }}
          >
            <span
              className="grid place-items-center rounded-full mx-auto mb-5"
              style={{ width: 64, height: 64, background: "rgba(37,99,235,0.14)" }}
            >
              <ShieldAlert size={32} color="#60a5fa" />
            </span>
            <h2 className="text-2xl font-bold text-white">Are you 18 or older?</h2>
            <p className="text-sm text-[var(--sl-white-dim)] mt-2 mb-6">
              StrangerLink connects you with random strangers. You must be an adult to continue.
            </p>
            <label className="flex items-center justify-center gap-2.5 text-sm text-[var(--sl-white-muted)] cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="accent-[var(--sl-accent)]"
                style={{ width: 16, height: 16 }}
              />
              I confirm I am 18 years or older
            </label>
            <Button fullWidth size="lg" disabled={!checked} onClick={confirm}>
              Continue
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AgeGate;
