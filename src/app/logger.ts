const DEBUG_KEY = "gerador-oficios:debug";

function debugEnabled() {
  return typeof localStorage !== "undefined" && localStorage.getItem(DEBUG_KEY) === "1";
}

export async function measureAsync<TValue>(
  label: string,
  operation: () => Promise<TValue>,
) {
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
