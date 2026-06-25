import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

function loadDevVars() {
  const path = resolve(packageRoot, ".dev.vars");
  if (!existsSync(path)) {
    console.error("Brak .dev.vars — skopiuj z .example.vars");
    process.exit(1);
  }

  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return vars;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const vars = loadDevVars();
const baseUrl = process.env.DATA_SERVICE_URL ?? "http://127.0.0.1:8787";
const limit = process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "3";
const force = process.argv.includes("--no-force") ? "0" : "1";
const sync = process.argv.includes("--sync");

const headers = { "Content-Type": "application/json" };
if (vars.API_KEY) {
  headers["x-api-key"] = vars.API_KEY;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { response, json };
}

async function waitForHealth(maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { response } = await fetchJson("/health");
      if (response.ok) return true;
    } catch {
      // worker jeszcze nie stoi
    }
    await sleep(2000);
  }
  return false;
}

async function latestCollectorRun() {
  const { response, json } = await fetchJson("/admin/ingestion-runs");
  if (!response.ok) return null;
  const run = json.runs?.find((r) => r.agentType === "collector");
  return run ?? null;
}

async function pollCollectorRun(sinceIso, timeoutMs = 600_000) {
  const deadline = Date.now() + timeoutMs;
  const since = new Date(sinceIso).getTime();

  while (Date.now() < deadline) {
    await sleep(3000);
    const run = await latestCollectorRun();
    if (!run?.startedAt) continue;
    const started = new Date(run.startedAt).getTime();
    if (started >= since - 1000 && run.finishedAt) {
      return run;
    }
  }
  return null;
}

const healthy = await waitForHealth();
if (!healthy) {
  console.error(
    `API niedostępne pod ${baseUrl}. Uruchom w osobnym terminalu: pnpm dev:data-service`
  );
  process.exit(1);
}

const query = `limit=${limit}&force=${force}${sync ? "" : "&async=1"}`;
const url = `${baseUrl}/admin/collect?${query}`;
console.log(`POST ${url}`);

let lastError = null;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const { response, json } = await fetchJson(`/admin/collect?${query}`, {
      method: "POST",
    });

    if (response.status === 503) {
      console.warn(
        `Próba ${attempt}/3: worker się przeładował (503). Czekam 5s…`
      );
      await sleep(5000);
      continue;
    }

    if (response.status === 202 && json.status === "started") {
      console.log("Collector w tle — czekam na wynik…");
      const run = await pollCollectorRun(json.startedAt);
      if (!run) {
        console.error(
          "Timeout — collector nie zakończył się w 10 min. Sprawdź logi wranglera."
        );
        process.exit(1);
      }
      console.log("Status: 200 (async)");
      console.log(JSON.stringify(run.statsJson, null, 2));
      process.exit(0);
    }

    console.log(`Status: ${response.status}`);
    console.log(JSON.stringify(json, null, 2));
    process.exit(response.ok ? 0 : 1);
  } catch (error) {
    lastError = error;
    console.warn(`Próba ${attempt}/3 nieudana:`, error.message ?? error);
    await sleep(3000);
  }
}

console.error(
  "Nie udało się uruchomić collectora po 3 próbach.",
  lastError ? `\nOstatni błąd: ${lastError.message ?? lastError}` : ""
);
console.error(
  "Tip: trzymaj `pnpm dev:data-service` włączone i nie zapisuj plików w data-service podczas collecta."
);
process.exit(1);
