import { LostFoundItem } from "../../types";

export function formatLostFoundItem(item: LostFoundItem) {
  const base = item.item.trim();
  const marca = item.marca?.trim();
  const descricao = item.descricao?.trim();

  return [
    base,
    marca ? `"${marca}"` : "",
    descricao ? `- ${descricao}` : "",
  ]
    .filter(Boolean)
    .join(" ");
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

export function makeItemId() {
  if ("crypto" in window && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
