import type { ChangeEventHandler, MouseEventHandler, ReactNode } from "react";
import { Icon } from "./icons";

// Componentes pequenos e sem estado para manter páginas focadas no fluxo.
type ButtonOptions = {
  className?: string;
  disabled?: boolean;
  iconName: string;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "danger";
};

export function ActionButton({
  className,
  disabled,
  iconName,
  label,
  onClick,
  title,
  type = "button",
  variant,
}: ButtonOptions) {
  // Variantes mapeiam para CSS próprio, sem dependência de framework externo.
  const classes = ["icon-button", variant, className].filter(Boolean).join(" ");
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      <Icon name={iconName} />
      <span>{label}</span>
    </button>
  );
}

type FieldProps = {
  children?: ReactNode;
  id: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  label: string;
  onChange(value: string): void;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
};

export function Field({
  children,
  id,
  inputMode,
  label,
  onChange,
  placeholder = "",
  readOnly,
  value,
}: FieldProps) {
  // children permite montar inputs compostos, como campo com botão de calendário.
  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onChange(event.currentTarget.value);
  };

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {children || (
        <input
          id={id}
          inputMode={inputMode}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={readOnly}
          value={value}
        />
      )}
    </label>
  );
}

type TextAreaFieldProps = {
  id: string;
  label: string;
  onChange(value: string): void;
  rows?: number;
  value: string;
};

export function TextAreaField({
  id,
  label,
  onChange,
  rows = 6,
  value,
}: TextAreaFieldProps) {
  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    onChange(event.currentTarget.value);
  };

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <textarea id={id} rows={rows} value={value} onChange={handleChange} />
    </label>
  );
}

type EmptyStateProps = {
  text?: string;
  title: string;
};

export function EmptyState({ text = "", title }: EmptyStateProps) {
  // Estado vazio padroniza listas sem dados em todas as páginas.
  return (
    <div className="empty-state">
      <Icon name="inbox" />
      <strong>{title}</strong>
      {text ? <span>{text}</span> : null}
    </div>
  );
}
