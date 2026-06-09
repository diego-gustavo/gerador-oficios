export function debounce<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
) {
  let timer: number | undefined;

  return (...args: TArgs) => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => callback(...args), delayMs);
  };
}
