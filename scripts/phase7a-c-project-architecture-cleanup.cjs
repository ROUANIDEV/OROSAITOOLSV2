#!/usr/bin/env node
/*
OROSAITOOLS cleanup — Phase 7A c-project architecture cleanup.
Purpose:
- Move the flat c-project workspace, scanner, CSC selector, model, and state files into domain folders.
- Rewrite relative imports by resolving the actual local file graph.
- Do not change runtime logic and do not leave compatibility shims.
Run from the repo root:
  node .\scripts\phase7a-c-project-architecture-cleanup.cjs
  npm run build
*/

const { runFeatureArchitectureCleanup } = require("./features-architecture-utils.cjs");

runFeatureArchitectureCleanup({
  phaseLabel: "Phase 7A c-project architecture cleanup",
  featureName: "c-project",
  plannedMoves: [
    ["CProjectWorkspace.tsx", "workspace/components/CProjectWorkspace.tsx"],
    ["CProjectInfoRow.tsx", "shared/components/CProjectInfoRow.tsx"],
    ["CProjectStatCard.tsx", "shared/components/CProjectStatCard.tsx"],
    ["CProjectStatusBadge.tsx", "shared/components/CProjectStatusBadge.tsx"],
    ["CProjectSummaryStats.tsx", "shared/components/CProjectSummaryStats.tsx"],
    ["CProjectScannerActionsBar.tsx", "scanner/components/CProjectScannerActionsBar.tsx"],
    ["CProjectScannerAlerts.tsx", "scanner/components/CProjectScannerAlerts.tsx"],
    ["CProjectScannerCard.tsx", "scanner/components/CProjectScannerCard.tsx"],
    ["ProjectScanPanel.tsx", "scanner/components/ProjectScanPanel.tsx"],
    ["useCProjectScannerActions.ts", "scanner/hooks/useCProjectScannerActions.ts"],
    ["CProjectCscFolderSelect.tsx", "csc/components/CProjectCscFolderSelect.tsx"],
    ["CProjectCscFoldersCard.tsx", "csc/components/CProjectCscFoldersCard.tsx"],
    ["CProjectCscFoldersTable.tsx", "csc/components/CProjectCscFoldersTable.tsx"],
    ["CProjectSelectedCscCard.tsx", "csc/components/CProjectSelectedCscCard.tsx"],
    ["CscSelector.tsx", "csc/components/CscSelector.tsx"],
    ["cProjectWorkspaceTypes.ts", "model/cProjectWorkspaceTypes.ts"],
    ["cProjectWorkspaceUtils.ts", "model/cProjectWorkspaceUtils.ts"],
    ["c-project-state.ts", "state/c-project-state.ts"],
  ],
  exactBarrelFiles: new Map([
    ["workspace/components/index.ts", 'export * from "./CProjectWorkspace";\n'],
    ["workspace/index.ts", 'export * from "./components";\n'],
    [
      "shared/components/index.ts",
      [
        'export * from "./CProjectInfoRow";',
        'export * from "./CProjectStatCard";',
        'export * from "./CProjectStatusBadge";',
        'export * from "./CProjectSummaryStats";',
        "",
      ].join("\n"),
    ],
    ["shared/index.ts", 'export * from "./components";\n'],
    [
      "scanner/components/index.ts",
      [
        'export * from "./CProjectScannerActionsBar";',
        'export * from "./CProjectScannerAlerts";',
        'export * from "./CProjectScannerCard";',
        'export * from "./ProjectScanPanel";',
        "",
      ].join("\n"),
    ],
    ["scanner/hooks/index.ts", 'export * from "./useCProjectScannerActions";\n'],
    ["scanner/index.ts", 'export * from "./components";\nexport * from "./hooks";\n'],
    [
      "csc/components/index.ts",
      [
        'export * from "./CProjectCscFolderSelect";',
        'export * from "./CProjectCscFoldersCard";',
        'export * from "./CProjectCscFoldersTable";',
        'export * from "./CProjectSelectedCscCard";',
        'export * from "./CscSelector";',
        "",
      ].join("\n"),
    ],
    ["csc/index.ts", 'export * from "./components";\n'],
    ["model/index.ts", 'export * from "./cProjectWorkspaceTypes";\nexport * from "./cProjectWorkspaceUtils";\n'],
    ["state/index.ts", 'export * from "./c-project-state";\n'],
    [
      "index.ts",
      [
        'export * from "./workspace";',
        'export * from "./scanner";',
        'export * from "./csc";',
        'export * from "./shared";',
        'export * from "./model";',
        'export * from "./state";',
        "",
      ].join("\n"),
    ],
  ]),
  expectedResult: [
    "workspace/components contains CProjectWorkspace",
    "scanner/components|hooks contains scanning UI and actions",
    "csc/components contains CSC selector/folder UI",
    "shared/components contains small reusable c-project UI atoms",
    "model and state contain non-UI files",
  ],
});
