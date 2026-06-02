import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const Field = forwardRef<HTMLInputElement, InputProps>(function Field(
  { label, id, ...props },
  ref,
) {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="field" htmlFor={fieldId}>
      <span>{label}</span>
      <input ref={ref} id={fieldId} {...props} />
    </label>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function TextareaField({ label, id, ...props }: TextareaProps) {
  const fieldId = id || `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="field" htmlFor={fieldId}>
      <span>{label}</span>
      <textarea id={fieldId} {...props} />
    </label>
  );
}
