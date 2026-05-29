#!/usr/bin/env node
/*
OROSAITOOLS cleanup — Phase 7D dashboard architecture cleanup.
Purpose:
- Split dashboard shell, navigation, pages, config, and model files into domain folders.
- Rewrite relative imports by resolving the actual local file graph.
- Do not change runtime logic and do not leave compatibility shims.
Run from the repo root:
  node .\scripts\phase7d-dashboard-architecture-cleanup.cjs
  npm run build
*/

const { runFeatureArchitectureCleanup } = require("./features-architecture-utils.cjs");

runFeatureArchitectureCleanup({
  phaseLabel: "Phase 7D dashboard architecture cleanup",
  featureName: "dashboard",
  plannedMoves: [
    ["AppDashboard.tsx", "shell/components/AppDashboard.tsx"],
    ["DashboardContent.tsx", "shell/components/DashboardContent.tsx"],
    ["DashboardTopbar.tsx", "shell/components/DashboardTopbar.tsx"],
    ["DashboardSidebar.tsx", "navigation/components/DashboardSidebar.tsx"],
    ["DashboardSidebarToolItem.tsx", "navigation/components/DashboardSidebarToolItem.tsx"],
    ["dashboardToolSelectors.ts", "model/dashboardToolSelectors.ts"],
    ["dashboardTypes.ts", "model/dashboardTypes.ts"],
    ["tool-config.ts", "config/tool-config.ts"],
  ],
  exactBarrelFiles: new Map([
    [
      "shell/components/index.ts",
      [
        'export * from "./AppDashboard";',
        'export * from "./DashboardContent";',
        'export * from "./DashboardTopbar";',
        "",
      ].join("\n"),
    ],
    ["shell/index.ts", 'export * from "./components";\n'],
    [
      "navigation/components/index.ts",
      [
        'export * from "./DashboardSidebar";',
        'export * from "./DashboardSidebarToolItem";',
        "",
      ].join("\n"),
    ],
    ["navigation/index.ts", 'export * from "./components";\n'],
    ["pages/index.ts", 'export * from "./DashboardOverview";\nexport * from "./ToolPlaceholder";\n'],
    ["model/index.ts", 'export * from "./dashboardToolSelectors";\nexport * from "./dashboardTypes";\n'],
    ["config/index.ts", 'export * from "./tool-config";\n'],
    [
      "index.ts",
      [
        'export * from "./shell";',
        'export * from "./navigation";',
        'export * from "./pages";',
        'export * from "./model";',
        'export * from "./config";',
        "",
      ].join("\n"),
    ],
  ]),
  expectedResult: [
    "shell/components contains dashboard layout shell",
    "navigation/components contains sidebar navigation UI",
    "pages contains route/page components",
    "model contains dashboard selectors and types",
    "config contains tool-config",
  ],
});
