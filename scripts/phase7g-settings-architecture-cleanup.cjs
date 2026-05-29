#!/usr/bin/env node
/*
OROSAITOOLS cleanup — Phase 7G settings architecture cleanup.
Purpose:
- Move settings workspace, setting cards, constants/model, and state into domain folders.
- Rewrite relative imports by resolving the actual local file graph.
- Do not change runtime logic and do not leave compatibility shims.
Run from the repo root:
  node .\scripts\phase7g-settings-architecture-cleanup.cjs
  npm run build
*/

const { runFeatureArchitectureCleanup } = require("./features-architecture-utils.cjs");

runFeatureArchitectureCleanup({
  phaseLabel: "Phase 7G settings architecture cleanup",
  featureName: "settings",
  plannedMoves: [
    ["SettingsWorkspace.tsx", "workspace/components/SettingsWorkspace.tsx"],
    ["components/SettingsAppearanceCard.tsx", "workspace/components/SettingsAppearanceCard.tsx"],
    ["components/SettingsDiagnosticsCard.tsx", "workspace/components/SettingsDiagnosticsCard.tsx"],
    ["components/SettingsHeaderCard.tsx", "workspace/components/SettingsHeaderCard.tsx"],
    ["components/SettingsPreferencesCard.tsx", "workspace/components/SettingsPreferencesCard.tsx"],
    ["components/SettingsStatusCard.tsx", "workspace/components/SettingsStatusCard.tsx"],
    ["components/SettingsStorageCard.tsx", "workspace/components/SettingsStorageCard.tsx"],
    ["utils/settingsConstants.ts", "model/settingsConstants.ts"],
    ["settings-state.ts", "state/settings-state.ts"],
  ],
  exactBarrelFiles: new Map([
    [
      "workspace/components/index.ts",
      [
        'export * from "./SettingsWorkspace";',
        'export * from "./SettingsAppearanceCard";',
        'export * from "./SettingsDiagnosticsCard";',
        'export * from "./SettingsHeaderCard";',
        'export * from "./SettingsPreferencesCard";',
        'export * from "./SettingsStatusCard";',
        'export * from "./SettingsStorageCard";',
        "",
      ].join("\n"),
    ],
    ["workspace/index.ts", 'export * from "./components";\n'],
    ["model/index.ts", 'export * from "./settingsConstants";\n'],
    ["state/index.ts", 'export * from "./settings-state";\n'],
    [
      "index.ts",
      [
        'export * from "./workspace";',
        'export * from "./model";',
        'export * from "./state";',
        "",
      ].join("\n"),
    ],
  ]),
  extraOldDirectories: ["components", "utils"],
  expectedResult: [
    "workspace/components contains settings page shell and cards",
    "model contains settingsConstants",
    "state contains settings-state",
  ],
});
