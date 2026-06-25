import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export type EnvTarget = "dev" | "production";

const ENV_FILES: Record<EnvTarget, string> = {
  dev: ".dev.vars",
  production: ".production.vars",
};

export function parseEnvTarget(argv = process.argv): EnvTarget {
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

export function loadEnvTarget(target: EnvTarget = "dev") {
  const fileName = ENV_FILES[target];
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    console.error(`Brak pliku ${fileName} — skopiuj z ${fileName}.example`);
    process.exit(1);
  }

  config({ path: filePath });
  return fileName;
}

/** @deprecated użyj loadEnvTarget("dev") */
export function loadLocalEnv() {
  loadEnvTarget("dev");
}
