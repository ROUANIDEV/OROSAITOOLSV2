#!/usr/bin/env node
/*
OROSAITOOLS cleanup — run all Phase 7 feature architecture cleanup scripts.
Run from the repo root:
  node .\scripts\phase7-run-all-feature-architecture-cleanups.cjs
  npm run build
*/

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const scripts = [
  "phase7a-c-project-architecture-cleanup.cjs",
  "phase7b-call-tree-architecture-cleanup.cjs",
  "phase7c-crc-architecture-cleanup.cjs",
  "phase7d-dashboard-architecture-cleanup.cjs",
  "phase7e-data-dictionary-architecture-cleanup.cjs",
  "phase7f-reports-architecture-cleanup.cjs",
  "phase7g-settings-architecture-cleanup.cjs",
  "phase7h-theme-architecture-cleanup.cjs",
];

for (const script of scripts) {
  const scriptPath = path.join("scripts", script);
  console.log(`\n==> node ${scriptPath}`);
  const result = spawnSync(process.execPath, [scriptPath], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nAll Phase 7 feature architecture cleanups finished.");
console.log("Next command:");
console.log(" npm run build");
