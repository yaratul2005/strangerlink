import { useEffect, useRef } from "react";
import { VideoOff } from "lucide-react";

function StreamVideo({ stream, muted }: { stream: MediaStream | null; muted: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />;
}

export function VideoPanel({
  localStream,
  remoteStream,
  videoEnabled,
  connecting,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  videoEnabled: boolean;
  connecting: boolean;
}) {
  const hasRemote = remoteStream && remoteStream.getTracks().length > 0;

  return (
    <div className="relative w-full h-full flex flex-col gap-3 p-3">
      {/* Stranger (top, large) */}
      <div
        className="relative flex-1 rounded-xl overflow-hidden grid place-items-center"
        style={{ border: "1px solid var(--sl-border)", background: "var(--sl-surface)" }}
      >
        {hasRemote ? (
          <div className="sl-fade-video w-full h-full">
            <StreamVideo stream={remoteStream} muted={false} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className="relative grid place-items-center" style={{ width: 120, height: 120 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: 120,
                    height: 120,
                    border: "2px solid rgba(37,99,235,0.5)",
                    animation: `sl-sonar 2s ${i * 0.5}s ease-out infinite`,
                  }}
                />
              ))}
              <span className="rounded-full" style={{ width: 16, height: 16, background: "var(--sl-accent)", boxShadow: "var(--sl-shadow-glow)" }} />
            </div>
            <p className="text-sm text-[var(--sl-white-dim)] animate-pulse">
              {connecting ? "Connecting to stranger…" : "Waiting for video…"}
            </p>
          </div>
        )}
        <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full text-white" style={{ background: "rgba(0,0,0,0.55)" }}>
          Stranger
        </span>
      </div>

      {/* You (bottom, smaller) */}
      <div
        className="relative rounded-xl overflow-hidden grid place-items-center shrink-0"
        style={{ height: "32%", minHeight: 120, border: "1px solid var(--sl-border)", background: "var(--sl-surface)" }}
      >
        {localStream && videoEnabled ? (
          <StreamVideo stream={localStream} muted />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[var(--sl-white-dim)]">
            <VideoOff size={28} />
            <span className="text-xs">Camera off</span>
          </div>
        )}
        <span className="absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full text-white" style={{ background: "rgba(37,99,235,0.8)" }}>
          You
        </span>
      </div>

      <style>{`
        .sl-fade-video { animation: sl-video-in 0.6s ease both; }
        @keyframes sl-video-in { from { filter: blur(20px); opacity: 0; } to { filter: blur(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

export default VideoPanel;
