import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export function WaitingModal({
  isOpen,
  onCancel,
  onlineCount,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onlineCount: number;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isOpen) {
      setElapsed(0);
      return;
    }
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <Modal isOpen={isOpen} hideClose closeOnBackdrop={false} size="sm">
      <div className="flex flex-col items-center text-center py-6">
        <h3 className="text-xl font-bold text-white mb-8">Finding you a stranger…</h3>
        <div className="relative grid place-items-center" style={{ width: 160, height: 160 }}>
          {[
            { size: 140, op: 0.18, delay: "1s" },
            { size: 100, op: 0.4, delay: "0.5s" },
          ].map((r) => (
            <span
              key={r.size}
              className="absolute rounded-full"
              style={{
                width: r.size,
                height: r.size,
                background: `rgba(37,99,235,${r.op})`,
                animation: `sl-sonar 2s ${r.delay} ease-out infinite`,
              }}
            />
          ))}
          <span
            className="rounded-full grid place-items-center"
            style={{ width: 60, height: 60, background: "var(--sl-accent)", boxShadow: "var(--sl-shadow-glow)" }}
          >
            <span className="block w-4 h-4 rounded-full bg-white animate-pulse" />
          </span>
        </div>
        <p className="text-sm text-[var(--sl-white-dim)] mt-8">
          Searching {onlineCount.toLocaleString()} active users
        </p>
        <p className="sl-mono text-2xl text-[var(--sl-glow)] mt-2">
          {mm}:{ss}
        </p>
        <Button variant="ghost" className="mt-6" onClick={onCancel}>
          Cancel Search
        </Button>
      </div>
    </Modal>
  );
}

export default WaitingModal;
