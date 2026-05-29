#!/usr/bin/env node
/*
OROSAITOOLS cleanup — Phase 7E data-dictionary architecture cleanup.
Purpose:
- Move data-dictionary workspace, table UI, model helpers, hooks, and state files into domain folders.
- Rewrite relative imports by resolving the actual local file graph.
- Do not change runtime logic and do not leave compatibility shims.
Run from the repo root:
  node .\scripts\phase7e-data-dictionary-architecture-cleanup.cjs
  npm run build
*/

const { runFeatureArchitectureCleanup } = require("./features-architecture-utils.cjs");

runFeatureArchitectureCleanup({
  phaseLabel: "Phase 7E data-dictionary architecture cleanup",
  featureName: "data-dictionary",
  plannedMoves: [
    ["DataDictionaryWorkspace.tsx", "workspace/components/DataDictionaryWorkspace.tsx"],
    ["components/DataDictionaryHeroCard.tsx", "workspace/components/DataDictionaryHeroCard.tsx"],
    ["components/DataDictionaryResultsSection.tsx", "workspace/components/DataDictionaryResultsSection.tsx"],
    ["components/DataDictionaryStatusAlerts.tsx", "workspace/components/DataDictionaryStatusAlerts.tsx"],
    ["components/DataDictionarySummaryCard.tsx", "workspace/components/DataDictionarySummaryCard.tsx"],
    ["hooks/useDataDictionaryActions.ts", "workspace/hooks/useDataDictionaryActions.ts"],
    ["tables/ConstantsTable.tsx", "tables/components/ConstantsTable.tsx"],
    ["tables/DataDictionaryTables.ts", "tables/components/DataDictionaryTables.ts"],
    ["tables/DataTypesTable.tsx", "tables/components/DataTypesTable.tsx"],
    ["tables/GlobalVariablesTable.tsx", "tables/components/GlobalVariablesTable.tsx"],
    ["types/dataDictionaryWorkspaceTypes.ts", "model/dataDictionaryWorkspaceTypes.ts"],
    ["utils/dataDictionaryAnalysisHelpers.ts", "model/dataDictionaryAnalysisHelpers.ts"],
    ["data-dictionary-state.ts", "state/data-dictionary-state.ts"],
  ],
  exactBarrelFiles: new Map([
    [
      "workspace/components/index.ts",
      [
        'export * from "./DataDictionaryWorkspace";',
        'export * from "./DataDictionaryHeroCard";',
        'export * from "./DataDictionaryResultsSection";',
        'export * from "./DataDictionaryStatusAlerts";',
        'export * from "./DataDictionarySummaryCard";',
        "",
      ].join("\n"),
    ],
    ["workspace/hooks/index.ts", 'export * from "./useDataDictionaryActions";\n'],
    ["workspace/index.ts", 'export * from "./components";\nexport * from "./hooks";\n'],
    [
      "tables/components/index.ts",
      [
        'export * from "./ConstantsTable";',
        'export * from "./DataDictionaryTables";',
        'export * from "./DataTypesTable";',
        'export * from "./GlobalVariablesTable";',
        "",
      ].join("\n"),
    ],
    ["tables/index.ts", 'export * from "./components";\n'],
    ["model/index.ts", 'export * from "./dataDictionaryAnalysisHelpers";\nexport * from "./dataDictionaryWorkspaceTypes";\n'],
    ["state/index.ts", 'export * from "./data-dictionary-state";\n'],
    [
      "index.ts",
      [
        'export * from "./workspace";',
        'export * from "./tables";',
        'export * from "./model";',
        'export * from "./state";',
        "",
      ].join("\n"),
    ],
  ]),
  extraOldDirectories: ["components", "hooks", "types", "utils"],
  expectedResult: [
    "workspace/components|hooks contains page shell and actions",
    "tables/components contains dictionary table UI",
    "model contains analysis helpers and workspace types",
    "state contains data-dictionary-state",
  ],
});
