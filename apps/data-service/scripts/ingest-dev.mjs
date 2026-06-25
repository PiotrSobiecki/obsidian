import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(script, extraArgs = []) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [resolve(root, "scripts", script), ...extraArgs],
      { stdio: "inherit", cwd: root }
    );
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${script} exited with ${code}`));
    });
  });
}

console.log("=== 1/2 Discovery Agent (kluby + Brave) ===");
await run("discover-dev.mjs");

console.log("\n=== 2/2 Collector Agent (rock/metal) ===");
const limit = process.argv.find((a) => a.startsWith("--limit=")) ?? "--limit=20";
await run("collect-dev.mjs", [limit]);

console.log("\nGotowe — sprawdź /koncerty lub: pnpm collect:check");
