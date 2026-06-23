export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="sl-typing-dot rounded-full"
          style={{
            width: 7,
            height: 7,
            background: "var(--sl-white-dim)",
            animation: `sl-typing 1.2s ${i * 0.15}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes sl-typing {
          0%, 100% { transform: scale(1); background: var(--sl-white-dim); }
          40% { transform: scale(1.4); background: var(--sl-accent-light); }
        }
      `}</style>
    </div>
  );
}

export default TypingIndicator;
