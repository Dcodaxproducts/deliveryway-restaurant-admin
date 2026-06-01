import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["scripts/check-import-paths.mjs"], {
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Vercel prebuild import check passed");
