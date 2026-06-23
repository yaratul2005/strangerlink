import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message } from "../../context/ChatContext";
import TypingIndicator from "./TypingIndicator";

export function TextChat({
  messages,
  strangerTyping,
  disabled,
  onSend,
  onTyping,
  onStopTyping,
}: {
  messages: Message[];
  strangerTyping: boolean;
  disabled: boolean;
  onSend: (text: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, strangerTyping]);

  const submit = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    onStopTyping();
  };

  const handleChange = (v: string) => {
    setText(v);
    onTyping();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(onStopTyping, 1000);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--sl-card)", borderLeft: "1px solid var(--sl-border)" }}>
      <div className="sl-scroll flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
        {messages.length === 0 && !strangerTyping && (
          <div className="flex-1 grid place-items-center text-center">
            <p className="text-sm text-[var(--sl-white-dim)] px-6">
              You're now chatting with a stranger. Say hi! 👋
            </p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender === "me";
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: mine ? 24 : -24, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className={`max-w-[78%] px-3.5 py-2 text-sm leading-relaxed ${mine ? "self-end" : "self-start"}`}
              style={{
                background: mine ? "var(--sl-accent)" : "#fff",
                color: mine ? "#fff" : "#0d1117",
                borderRadius: mine ? "16px 16px 3px 16px" : "16px 16px 16px 3px",
              }}
            >
              {m.text}
            </motion.div>
          );
        })}
        {strangerTyping && (
          <div className="self-start rounded-2xl" style={{ background: "#fff" }}>
            <TypingIndicator />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--sl-border)" }}>
        <input
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          disabled={disabled}
          placeholder={disabled ? "Waiting for a stranger…" : "Type a message…"}
          maxLength={500}
          className="flex-1 px-4 py-2.5 rounded-full text-sm text-white outline-none disabled:opacity-50"
          style={{ background: "var(--sl-surface)", border: "1px solid var(--sl-border)" }}
        />
        <button
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="sl-send-btn grid place-items-center rounded-full shrink-0 disabled:opacity-40"
          style={{ width: 42, height: 42, background: "var(--sl-accent)", color: "#fff", transition: "var(--sl-t-normal)" }}
        >
          <Send size={18} />
        </button>
      </div>
      <style>{`.sl-send-btn:hover:not(:disabled){ background: var(--sl-accent-light); box-shadow: var(--sl-shadow-glow); }`}</style>
    </div>
  );
}

export default TextChat;
