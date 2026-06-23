import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

const sizeStyles: Record<Size, string> = {
  sm: "text-sm px-4 py-2 gap-1.5",
  md: "text-[15px] px-5 py-2.5 gap-2",
  lg: "text-base px-7 py-3.5 gap-2.5",
};

const variantClass: Record<Variant, string> = {
  primary: "sl-btn-primary",
  ghost: "sl-btn-ghost",
  danger: "sl-btn-danger",
  outline: "sl-btn-outline",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`sl-btn ${variantClass[variant]} ${sizeStyles[size]} ${
        fullWidth ? "w-full" : ""
      } inline-flex items-center justify-center font-semibold rounded-full select-none ${className}`}
      style={{ transition: "var(--sl-t-normal)" }}
    >
      {loading ? (
        <Loader2 size={size === "lg" ? 20 : 18} className="animate-spin" />
      ) : (
        icon
      )}
      {children && <span>{children}</span>}

      <style>{`
        .sl-btn { border: none; cursor: pointer; line-height: 1; white-space: nowrap; }
        .sl-btn:active:not(:disabled) { transform: scale(0.97); }
        .sl-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .sl-btn-primary { background: var(--sl-accent); color: #fff; }
        .sl-btn-primary:hover:not(:disabled) { background: var(--sl-accent-light); box-shadow: var(--sl-shadow-glow); }

        .sl-btn-ghost { background: transparent; color: var(--sl-white); }
        .sl-btn-ghost:hover:not(:disabled) { background: rgba(37,99,235,0.12); }

        .sl-btn-danger { background: var(--sl-danger); color: #fff; }
        .sl-btn-danger:hover:not(:disabled) { background: #f05252; box-shadow: 0 0 24px rgba(239,68,68,0.4); }

        .sl-btn-outline { background: transparent; color: var(--sl-white); border: 1px solid var(--sl-border); }
        .sl-btn-outline:hover:not(:disabled) { border-color: var(--sl-accent); box-shadow: var(--sl-shadow-glow); }
      `}</style>
    </button>
  );
}

export default Button;
