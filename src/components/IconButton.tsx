import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  variant?: "quiet" | "primary" | "danger";
}

export function IconButton({
  label,
  icon,
  variant = "quiet",
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      className={`icon-button ${variant} ${className}`}
      title={label}
      aria-label={label}
      type="button"
      {...props}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
