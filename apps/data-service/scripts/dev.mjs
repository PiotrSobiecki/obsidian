import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const wranglerBin = join(
  packageRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "wrangler.cmd" : "wrangler"
);

function loadDevVars() {
  const path = resolve(packageRoot, ".dev.vars");
  if (!existsSync(path)) {
    return {};
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

const devVars = loadDevVars();
const databaseUrl = devVars.DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "Brak DATABASE_URL. Skopiuj .dev.vars.example → .dev.vars i uzupełnij connection string do Neon."
  );
  process.exit(1);
}

const env = {
  ...process.env,
  ...devVars,
  DATABASE_URL: databaseUrl,
  CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: databaseUrl,
};

const child = spawn(wranglerBin, ["dev", "--port", "8787", "--test-scheduled"], {
  stdio: "inherit",
  shell: true,
  cwd: packageRoot,
  env,
});

child.on("exit", (code) => process.exit(code ?? 0));
