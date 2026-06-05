type AttributeValue = string | number | boolean | null | undefined;

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function escapeAttr(value: unknown) {
  return escapeHtml(value);
}

export function attributes(attrs: Record<string, AttributeValue>) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== false && value !== null && value !== undefined)
    .map(([name, value]) => ` ${name}="${escapeAttr(value)}"`)
    .join("");
}

export function query<T extends HTMLElement>(
  selector: string,
  parent: ParentNode = document,
): T {
  const element = parent.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Elemento nao encontrado: ${selector}`);
  }
  return element;
}

export function bindInput(
  parent: ParentNode,
  selector: string,
  onValue: (value: string) => void,
) {
  const input = query<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    selector,
    parent,
  );
  input.addEventListener("input", () => onValue(input.value));
  input.addEventListener("change", () => onValue(input.value));
}
