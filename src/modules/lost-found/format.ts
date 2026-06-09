import { LostFoundItem } from "../../types";

export function formatLostFoundItem(item: LostFoundItem) {
  const base = item.item.trim();
  const marca = item.marca?.trim();
  const descricao = item.descricao?.trim();
  const observacao = item.observacao?.trim();

  return [
    base,
    marca ? `"${marca}"` : "",
    descricao ? `- ${descricao}` : "",
    observacao ? `(${observacao})` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function defaultLostFoundDocumentName(year: number, officioNumber: string) {
  const number = Number(officioNumber.split("/")[0] || "1");
  const paddedNumber = Number.isFinite(number)
    ? String(number).padStart(3, "0")
    : "001";
  return `${year} ${paddedNumber} - Encaminhamento de Achados e Perdidos`;
}

export function todayBrDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

export function isValidBrDate(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value.trim())) {
    return false;
  }
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function brDateToIso(value: string) {
  if (!isValidBrDate(value)) {
    return "";
  }
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

export function isoDateToBr(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function makeItemId() {
  if ("crypto" in window && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
