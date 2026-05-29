#!/usr/bin/env node
/*
OROSAITOOLS cleanup — Phase 7F reports architecture cleanup.
Purpose:
- Move reports workspace shell, hooks, filters/model helpers, and report types into domain folders.
- Add barrels for existing cards, filters, and layout folders.
- Rewrite relative imports by resolving the actual local file graph.
- Do not change runtime logic and do not leave compatibility shims.
Run from the repo root:
  node .\scripts\phase7f-reports-architecture-cleanup.cjs
  npm run build
*/

const { runFeatureArchitectureCleanup } = require("./features-architecture-utils.cjs");

runFeatureArchitectureCleanup({
  phaseLabel: "Phase 7F reports architecture cleanup",
  featureName: "reports",
  plannedMoves: [
    ["ReportsWorkspace.tsx", "workspace/components/ReportsWorkspace.tsx"],
    ["hooks/useReportsActions.ts", "workspace/hooks/useReportsActions.ts"],
    ["types/reportsTypes.ts", "model/reportsTypes.ts"],
    ["reportModels.ts", "model/reportModels.ts"],
    ["utils/reportsFilters.ts", "model/reportsFilters.ts"],
    ["utils/reportsUtils.ts", "model/reportsUtils.ts"],
  ],
  exactBarrelFiles: new Map([
    ["workspace/components/index.ts", 'export * from "./ReportsWorkspace";\n'],
    ["workspace/hooks/index.ts", 'export * from "./useReportsActions";\n'],
    ["workspace/index.ts", 'export * from "./components";\nexport * from "./hooks";\n'],
    [
      "components/cards/index.ts",
      [
        'export * from "./ReportCard";',
        'export * from "./ReportCardActions";',
        'export * from "./ReportCardAlerts";',
        'export * from "./ReportCardMetrics";',
        'export * from "./ReportStatCard";',
        'export * from "./ReportsOverviewActions";',
        'export * from "./ReportsOverviewCard";',
        'export * from "./ReportsOverviewStatus";',
        "",
      ].join("\n"),
    ],
    ["components/filters/index.ts", 'export * from "./ReportsFiltersCard";\n'],
    ["components/layout/index.ts", 'export * from "./ReportsList";\n'],
    [
      "components/index.ts",
      [
        'export * from "./cards";',
        'export * from "./filters";',
        'export * from "./layout";',
        "",
      ].join("\n"),
    ],
    [
      "model/index.ts",
      [
        'export * from "./reportModels";',
        'export * from "./reportsFilters";',
        'export * from "./reportsTypes";',
        'export * from "./reportsUtils";',
        "",
      ].join("\n"),
    ],
    [
      "index.ts",
      [
        'export * from "./workspace";',
        'export * from "./components";',
        'export * from "./model";',
        "",
      ].join("\n"),
    ],
  ]),
  extraOldDirectories: ["hooks", "types", "utils"],
  expectedResult: [
    "workspace/components|hooks contains reports page shell and actions",
    "components/cards|filters|layout stays UI-only and has barrels",
    "model contains reportModels, reportsTypes, reportsFilters, and reportsUtils",
  ],
});
