import { escapeAttr, escapeHtml } from "./dom";
import { icon } from "./icons";

type ButtonOptions = {
  disabled?: boolean;
  id?: string;
  variant?: "primary" | "danger";
};

export function button(
  label: string,
  iconName: string,
  action: string,
  options: ButtonOptions = {},
) {
  const className = ["icon-button", options.variant].filter(Boolean).join(" ");
  const disabled = options.disabled ? " disabled" : "";
  const dataId = options.id ? ` data-id="${escapeAttr(options.id)}"` : "";
  return `<button type="button" class="${className}" data-action="${action}"${dataId}${disabled}>${icon(iconName)}<span>${escapeHtml(label)}</span></button>`;
}

export function field(
  label: string,
  id: string,
  value: string,
  placeholder = "",
  inputMode?: string,
) {
  const mode = inputMode ? ` inputmode="${escapeAttr(inputMode)}"` : "";
  return `
    <label class="field" for="${escapeAttr(id)}">
      <span>${escapeHtml(label)}</span>
      <input id="${escapeAttr(id)}" value="${escapeAttr(value)}" placeholder="${escapeAttr(placeholder)}"${mode} />
    </label>
  `;
}

export function emptyState(title: string, text = "") {
  return `
    <div class="empty-state">
      ${icon("inbox")}
      <strong>${escapeHtml(title)}</strong>
      ${text ? `<span>${escapeHtml(text)}</span>` : ""}
    </div>
  `;
}
