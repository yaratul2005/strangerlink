import { type ReactNode } from "react";

type Variant = "online" | "waiting" | "connected" | "error";

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  pulse?: boolean;
}

const config: Record<Variant, { dot: string; bg: string; text: string; blink?: boolean }> = {
  online: { dot: "#22c55e", bg: "rgba(34,197,94,0.12)", text: "#86efac" },
  waiting: { dot: "#f59e0b", bg: "rgba(245,158,11,0.12)", text: "#fcd34d", blink: true },
  connected: { dot: "#3b82f6", bg: "rgba(37,99,235,0.14)", text: "#93c5fd" },
  error: { dot: "#ef4444", bg: "rgba(239,68,68,0.12)", text: "#fca5a5" },
};

export function Badge({ variant = "online", children, pulse = false }: BadgeProps) {
  const c = config[variant];
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="relative grid place-items-center" style={{ width: 8, height: 8 }}>
        {pulse && (
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: c.dot, animation: "sl-sonar 1.6s ease-out infinite" }}
          />
        )}
        <span
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            background: c.dot,
            animation: c.blink ? "sl-blink 1.2s ease-in-out infinite" : undefined,
          }}
        />
      </span>
      {children}
    </span>
  );
}

export default Badge;
