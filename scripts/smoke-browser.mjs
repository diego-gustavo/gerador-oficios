import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const host = "127.0.0.1";
const port = 4173;
const url = `http://${host}:${port}`;

function browserCandidates() {
  // Variáveis de ambiente permitem usar navegador portátil ou caminho corporativo.
  const env = process.env;
  return [
    env.BROWSER_BIN,
    env.CHROME_BIN,
    env.MSEDGE_BIN,
    join(env.PROGRAMFILES || "", "Google/Chrome/Application/chrome.exe"),
    join(env["PROGRAMFILES(X86)"] || "", "Google/Chrome/Application/chrome.exe"),
    join(env.PROGRAMFILES || "", "Microsoft/Edge/Application/msedge.exe"),
    join(env["PROGRAMFILES(X86)"] || "", "Microsoft/Edge/Application/msedge.exe"),
    join(env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
    join(env.LOCALAPPDATA || "", "Microsoft/Edge/Application/msedge.exe"),
  ].filter(Boolean);
}

function findBrowser() {
  // Usa o primeiro Chrome/Edge encontrado nos caminhos comuns do Windows.
  return browserCandidates().find((candidate) => existsSync(candidate));
}

function waitForPreview() {
  // O preview sobe em processo separado; tentamos HTTP até estar pronto.
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    async function ping() {
      try {
        const response = await fetch(url);
        if (response.ok) {
          resolve();
          return;
        }
      } catch {
        // Preview ainda subindo.
      }

      if (Date.now() - startedAt > 20_000) {
        reject(new Error(`Preview não respondeu em ${url}.`));
        return;
      }
      setTimeout(ping, 250);
    }

    void ping();
  });
}

function runBrowser(browserPath) {
  // --dump-dom executa a página em navegador real e devolve o DOM renderizado.
  const args = [
    "--headless",
    "--disable-gpu",
    "--no-first-run",
    "--disable-extensions",
    "--virtual-time-budget=3000",
    "--window-size=1280,720",
    "--dump-dom",
    url,
  ];

  return new Promise((resolve, reject) => {
    const browser = spawn(browserPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";

    browser.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    browser.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    browser.on("error", reject);
    browser.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Navegador saiu com código ${code}.`));
        return;
      }
      resolve(stdout);
    });
  });
}

const browserPath = findBrowser();
if (!browserPath) {
  throw new Error("Chrome ou Edge não encontrado. Defina BROWSER_BIN com o caminho do navegador.");
}

const preview = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "preview", "--host", host, "--port", String(port), "--strictPort"],
  {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);

try {
  await waitForPreview();
  const dom = await runBrowser(browserPath);
  const expectedTexts = ["Gerador BRT", "Geradores", "Achados", "Rascunhos", "Config", "Ajuda"];
  const missing = expectedTexts.filter((text) => !dom.includes(text));

  if (missing.length) {
    throw new Error(`Smoke falhou. Textos ausentes no DOM: ${missing.join(", ")}`);
  }

  console.log(`Smoke OK em ${url} usando ${browserPath}`);
} finally {
  preview.kill();
}
