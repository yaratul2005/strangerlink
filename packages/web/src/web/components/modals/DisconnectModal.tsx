import { motion } from "framer-motion";
import { UserX } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import type { DisconnectReason } from "../../context/ChatContext";

export function DisconnectModal({
  isOpen,
  reason,
  onNewStranger,
  onStop,
}: {
  isOpen: boolean;
  reason: DisconnectReason;
  onNewStranger: () => void;
  onStop: () => void;
}) {
  const title =
    reason === "you_left"
      ? "You ended the chat"
      : reason === "error"
        ? "Connection error"
        : "Stranger has disconnected";
  const subtitle =
    reason === "you_left"
      ? "Ready to meet someone new?"
      : "They left the chat. Want to find someone new?";

  return (
    <Modal isOpen={isOpen} hideClose closeOnBackdrop={false} size="sm">
      <div className="flex flex-col items-center text-center py-6">
        <motion.div
          className="grid place-items-center rounded-full mb-5"
          style={{ width: 80, height: 80, background: "rgba(239,68,68,0.12)" }}
          animate={{ boxShadow: ["0 0 0 rgba(239,68,68,0)", "0 0 28px rgba(239,68,68,0.5)", "0 0 0 rgba(239,68,68,0)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <UserX size={40} color="#ef4444" />
        </motion.div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-[var(--sl-white-dim)] mt-2 mb-6">{subtitle}</p>
        <div className="flex flex-col gap-3 w-full">
          <Button fullWidth size="lg" onClick={onNewStranger}>
            Find New Stranger
          </Button>
          <Button fullWidth variant="ghost" onClick={onStop}>
            Go Home
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DisconnectModal;
