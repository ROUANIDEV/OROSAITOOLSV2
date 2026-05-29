#!/usr/bin/env node
/*
OROSAITOOLS cleanup — Phase 7C crc architecture cleanup.
Purpose:
- Split CRC workspace, history, profiles, parameters, model, and result UI into domain folders.
- Rewrite relative imports by resolving the actual local file graph.
- Do not change runtime logic and do not leave compatibility shims.
Run from the repo root:
  node .\scripts\phase7c-crc-architecture-cleanup.cjs
  npm run build
*/

const { runFeatureArchitectureCleanup } = require("./features-architecture-utils.cjs");

runFeatureArchitectureCleanup({
  phaseLabel: "Phase 7C crc architecture cleanup",
  featureName: "crc",
  plannedMoves: [
    ["CrcCalculatorWorkspace.tsx", "workspace/components/CrcCalculatorWorkspace.tsx"],
    ["components/CrcUi.tsx", "workspace/components/CrcUi.tsx"],
    ["components/CrcInputCard.tsx", "workspace/components/CrcInputCard.tsx"],
    ["components/CrcSummaryCard.tsx", "results/components/CrcSummaryCard.tsx"],
    ["components/CrcHistoryCard.tsx", "history/components/CrcHistoryCard.tsx"],
    ["crc-history.ts", "history/model/crc-history.ts"],
    ["components/CrcProfilesCard.tsx", "profiles/components/CrcProfilesCard.tsx"],
    ["crc-profiles.ts", "profiles/model/crc-profiles.ts"],
    ["components/CrcParametersCard.tsx", "parameters/components/CrcParametersCard.tsx"],
    ["crc-config.ts", "model/crc-config.ts"],
  ],
  exactBarrelFiles: new Map([
    [
      "workspace/components/index.ts",
      [
        'export * from "./CrcCalculatorWorkspace";',
        'export * from "./CrcInputCard";',
        'export * from "./CrcUi";',
        "",
      ].join("\n"),
    ],
    ["workspace/index.ts", 'export * from "./components";\n'],
    ["results/components/index.ts", 'export * from "./CrcSummaryCard";\n'],
    ["results/index.ts", 'export * from "./components";\n'],
    ["history/components/index.ts", 'export * from "./CrcHistoryCard";\n'],
    ["history/model/index.ts", 'export * from "./crc-history";\n'],
    ["history/index.ts", 'export * from "./components";\nexport * from "./model";\n'],
    ["profiles/components/index.ts", 'export * from "./CrcProfilesCard";\n'],
    ["profiles/model/index.ts", 'export * from "./crc-profiles";\n'],
    ["profiles/index.ts", 'export * from "./components";\nexport * from "./model";\n'],
    ["parameters/components/index.ts", 'export * from "./CrcParametersCard";\n'],
    ["parameters/index.ts", 'export * from "./components";\n'],
    ["model/index.ts", 'export * from "./crc-config";\n'],
    [
      "index.ts",
      [
        'export * from "./workspace";',
        'export * from "./results";',
        'export * from "./history";',
        'export * from "./profiles";',
        'export * from "./parameters";',
        'export * from "./model";',
        "",
      ].join("\n"),
    ],
  ]),
  extraOldDirectories: ["components"],
  expectedResult: [
    "workspace/components contains CRC shell and input UI",
    "history/components|model contains history UI and storage/model helpers",
    "profiles/components|model contains profile UI and profile data",
    "parameters/components contains parameter UI",
    "results/components contains summary/result UI",
  ],
});
