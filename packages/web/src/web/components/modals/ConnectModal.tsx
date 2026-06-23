import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import type { Mode } from "../../context/ChatContext";

const LANGUAGES = ["English", "Español", "Français", "Deutsch", "हिन्दी", "العربية", "中文", "বাংলা"];

export function ConnectModal({
  isOpen,
  mode,
  onClose,
  onStart,
}: {
  isOpen: boolean;
  mode: Mode;
  onClose: () => void;
  onStart: (interests: string[], language: string) => void;
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [agreed, setAgreed] = useState(false);

  const addTag = () => {
    const v = input.trim().toLowerCase();
    if (v && !tags.includes(v) && tags.length < 10) setTags([...tags, v]);
    setInput("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ready to meet someone?" size="md">
      <div className="flex flex-col gap-5 pt-1">
        <div className="flex flex-wrap gap-2">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(37,99,235,0.14)", color: "#93c5fd" }}
          >
            {mode === "video" ? "Video chat" : "Text chat"} selected
          </span>
        </div>

        <div>
          <label className="text-sm text-[var(--sl-white-dim)] block mb-2">Your interests (optional)</label>
          <div
            className="flex flex-wrap gap-2 p-2 rounded-xl"
            style={{ background: "var(--sl-surface)", border: "1px solid var(--sl-border)" }}
          >
            <AnimatePresence>
              {tags.map((t) => (
                <motion.span
                  key={t}
                  layout
                  initial={{ opacity: 0, scale: 0.8, x: -8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                  style={{ background: "var(--sl-accent)", color: "#fff" }}
                >
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <X size={12} />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              onBlur={addTag}
              placeholder={tags.length ? "" : "music, gaming, movies…"}
              className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-white px-1 py-1"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-[var(--sl-white-dim)] block mb-2">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: "var(--sl-surface)", border: "1px solid var(--sl-border)" }}
          >
            {LANGUAGES.map((l) => (
              <option key={l} style={{ background: "#0d1117" }}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-start gap-2.5 text-sm text-[var(--sl-white-dim)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-[var(--sl-accent)]"
            style={{ width: 16, height: 16 }}
          />
          I am 18 or older and agree to the Terms of Service.
        </label>

        <Button
          fullWidth
          size="lg"
          disabled={!agreed}
          className={agreed ? "sl-anim-glowPulse" : ""}
          onClick={() => onStart(tags, language)}
        >
          Start {mode === "video" ? "Video" : "Text"} Chat
        </Button>
      </div>
    </Modal>
  );
}

export default ConnectModal;
