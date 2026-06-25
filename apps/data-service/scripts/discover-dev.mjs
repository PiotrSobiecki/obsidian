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

async function latestDiscoveryRun() {
  const { response, json } = await fetchJson("/admin/ingestion-runs");
  if (!response.ok) return null;
  return json.runs?.find((r) => r.agentType === "discovery") ?? null;
}

async function pollDiscoveryRun(sinceIso, timeoutMs = 600_000) {
  const deadline = Date.now() + timeoutMs;
  const since = new Date(sinceIso).getTime();

  while (Date.now() < deadline) {
    await sleep(4000);
    const run = await latestDiscoveryRun();
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
    `API niedostępne pod ${baseUrl}. Uruchom: pnpm dev:data-service`
  );
  process.exit(1);
}

const query = sync ? "" : "?async=1";
const url = `${baseUrl}/admin/discover${query}`;
console.log(`POST ${url} — Discovery Agent (kluby + Brave Search)`);

const { response, json } = await fetchJson(`/admin/discover${query}`, {
  method: "POST",
});

if (response.status === 202 && json.status === "started") {
  console.log("Discovery w tle — czekam na wynik…");
  const run = await pollDiscoveryRun(json.startedAt);
  if (!run) {
    console.error("Timeout — discovery nie zakończył się w 10 min.");
    process.exit(1);
  }
  console.log("Status: 200 (async)");
  console.log(JSON.stringify(run.statsJson, null, 2));
  process.exit(0);
}

console.log(`Status: ${response.status}`);
console.log(JSON.stringify(json, null, 2));
process.exit(response.ok ? 0 : 1);
