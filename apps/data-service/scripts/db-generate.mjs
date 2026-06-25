import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

function parseEnvTarget(argv) {
  const flagIndex = argv.findIndex((arg) => arg === "--env");
  if (flagIndex !== -1 && argv[flagIndex + 1]) {
    const value = argv[flagIndex + 1];
    if (value === "production" || value === "prod") return "production";
    return "dev";
  }

  const inline = argv.find((arg) => arg.startsWith("--env="));
  if (inline) {
    const value = inline.split("=")[1];
    if (value === "production" || value === "prod") return "production";
    return "dev";
  }

  return "dev";
}

const target = parseEnvTarget(process.argv.slice(2));
const drizzleKit = join(
  packageRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "drizzle-kit.cmd" : "drizzle-kit"
);

console.log(`Generating migrations (${target})…`);

const result = spawnSync(drizzleKit, ["generate"], {
  stdio: "inherit",
  shell: true,
  cwd: packageRoot,
  env: {
    ...process.env,
    DRIZZLE_ENV: target,
  },
});

process.exit(result.status ?? 1);
