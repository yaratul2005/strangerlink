import { Flag, Mic, MicOff, SkipForward, Square, Video, VideoOff } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  mode: "video" | "text";
  audioEnabled: boolean;
  videoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onSkip: () => void;
  onStop: () => void;
  onReport: () => void;
  disabled: boolean;
}

function CtrlButton({
  children,
  label,
  active,
  danger,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="sl-ctrl group flex flex-col items-center gap-1 disabled:opacity-40"
    >
      <span
        className="sl-ctrl-icon grid place-items-center rounded-full"
        style={{
          width: 48,
          height: 48,
          background: active ? "var(--sl-danger)" : danger ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)",
          color: active ? "#fff" : danger ? "#ef4444" : "#fff",
          transition: "var(--sl-t-normal)",
        }}
      >
        {children}
      </span>
      <span className="text-[11px] text-[var(--sl-white-dim)] hidden sm:block">{label}</span>
    </button>
  );
}

export function ControlBar({
  mode,
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onSkip,
  onStop,
  onReport,
  disabled,
}: Props) {
  return (
    <div
      className="flex items-center justify-center gap-5 sm:gap-7 px-4"
      style={{
        height: 72,
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--sl-border)",
      }}
    >
      {mode === "video" && (
        <>
          <CtrlButton label="Mute" active={!audioEnabled} onClick={onToggleAudio}>
            {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </CtrlButton>
          <CtrlButton label="Camera" active={!videoEnabled} onClick={onToggleVideo}>
            {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </CtrlButton>
        </>
      )}

      <button onClick={onSkip} disabled={disabled} className="sl-skip flex flex-col items-center gap-1 disabled:opacity-40">
        <motion.span
          whileHover={{ rotate: 18 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="grid place-items-center rounded-full"
          style={{ width: 52, height: 52, background: "var(--sl-accent)", color: "#fff", boxShadow: "var(--sl-shadow-glow)" }}
        >
          <SkipForward size={22} />
        </motion.span>
        <span className="text-[11px] text-[var(--sl-glow)] font-semibold">New</span>
      </button>

      <CtrlButton label="Stop" danger onClick={onStop}>
        <Square size={18} fill="currentColor" />
      </CtrlButton>
      <CtrlButton label="Report" danger onClick={onReport} disabled={disabled}>
        <Flag size={20} />
      </CtrlButton>

      <style>{`
        .sl-ctrl:hover .sl-ctrl-icon { box-shadow: 0 0 12px rgba(37,99,235,0.4); }
      `}</style>
    </div>
  );
}

export default ControlBar;
