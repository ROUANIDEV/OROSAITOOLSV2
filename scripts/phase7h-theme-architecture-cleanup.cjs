#!/usr/bin/env node
/*
OROSAITOOLS cleanup — Phase 7H theme architecture cleanup.
Purpose:
- Move theme provider and toggle UI into clear provider/components folders.
- Rewrite relative imports by resolving the actual local file graph.
- Do not change runtime logic and do not leave compatibility shims.
Run from the repo root:
  node .\scripts\phase7h-theme-architecture-cleanup.cjs
  npm run build
*/

const { runFeatureArchitectureCleanup } = require("./features-architecture-utils.cjs");

runFeatureArchitectureCleanup({
  phaseLabel: "Phase 7H theme architecture cleanup",
  featureName: "theme",
  plannedMoves: [
    ["theme-provider.tsx", "provider/theme-provider.tsx"],
    ["theme-toggle.tsx", "components/theme-toggle.tsx"],
  ],
  exactBarrelFiles: new Map([
    ["provider/index.ts", 'export * from "./theme-provider";\n'],
    ["components/index.ts", 'export * from "./theme-toggle";\n'],
    ["index.ts", 'export * from "./provider";\nexport * from "./components";\n'],
  ]),
  expectedResult: [
    "provider contains theme-provider",
    "components contains theme-toggle",
  ],
});
