const DEBUG_KEY = "gerador-oficios:debug";

// Medição opt-in: habilite localStorage["gerador-oficios:debug"] = "1".
function debugEnabled() {
  return typeof localStorage !== "undefined" && localStorage.getItem(DEBUG_KEY) === "1";
}

export async function measureAsync<TValue>(
  label: string,
  operation: () => Promise<TValue>,
) {
  // Sem debug, não adiciona custo nem ruído de console.
  if (!debugEnabled()) {
    return operation();
  }

  const start = performance.now();
  try {
    return await operation();
  } finally {
    const elapsed = Math.round(performance.now() - start);
    console.info(`[gerador-oficios] ${label}: ${elapsed}ms`);
  }
}
