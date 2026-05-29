#!/usr/bin/env node
/*
OROSAITOOLS cleanup — Phase 7B call-tree architecture cleanup.
Purpose:
- Move call-tree workspace, graph, tables, model, hooks, selectors, and state files into domain folders.
- Rewrite relative imports by resolving the actual local file graph.
- Do not change runtime logic and do not leave compatibility shims.
Run from the repo root:
  node .\scripts\phase7b-call-tree-architecture-cleanup.cjs
  npm run build
*/

const { runFeatureArchitectureCleanup } = require("./features-architecture-utils.cjs");

runFeatureArchitectureCleanup({
  phaseLabel: "Phase 7B call-tree architecture cleanup",
  featureName: "call-tree",
  plannedMoves: [
    ["CallTreeWorkspace.tsx", "workspace/components/CallTreeWorkspace.tsx"],
    ["components/CallTreeHeroCard.tsx", "workspace/components/CallTreeHeroCard.tsx"],
    ["components/CallTreeResultsSection.tsx", "workspace/components/CallTreeResultsSection.tsx"],
    ["components/CallTreeStatusAlerts.tsx", "workspace/components/CallTreeStatusAlerts.tsx"],
    ["components/CallTreeSummaryCard.tsx", "workspace/components/CallTreeSummaryCard.tsx"],
    ["hooks/useCallTreeActions.ts", "workspace/hooks/useCallTreeActions.ts"],
    ["CallTreeGraph.tsx", "graph/components/CallTreeGraph.tsx"],
    ["graph/CallTreeGraphCanvas.tsx", "graph/components/CallTreeGraphCanvas.tsx"],
    ["graph/CallTreeGraphEmptyState.tsx", "graph/components/CallTreeGraphEmptyState.tsx"],
    ["graph/CallTreeGraphHeader.tsx", "graph/components/CallTreeGraphHeader.tsx"],
    ["graph/CallTreeGraphInfo.tsx", "graph/components/CallTreeGraphInfo.tsx"],
    ["graph/CallTreeGraphRenderers.tsx", "graph/components/CallTreeGraphRenderers.tsx"],
    ["graph/CallTreeGraphSelectedNode.tsx", "graph/components/CallTreeGraphSelectedNode.tsx"],
    ["graph/CallTreeGraphSidebar.tsx", "graph/components/CallTreeGraphSidebar.tsx"],
    ["graph/callTreeGraphConstants.ts", "graph/model/callTreeGraphConstants.ts"],
    ["graph/callTreeGraphData.ts", "graph/model/callTreeGraphData.ts"],
    ["graph/callTreeGraphLayout.ts", "graph/model/callTreeGraphLayout.ts"],
    ["graph/callTreeGraphReadUtils.ts", "graph/model/callTreeGraphReadUtils.ts"],
    ["graph/callTreeGraphTypes.ts", "graph/model/callTreeGraphTypes.ts"],
    ["tables/CallTreeCallsTable.tsx", "tables/components/CallTreeCallsTable.tsx"],
    ["tables/CallTreeFunctionsTable.tsx", "tables/components/CallTreeFunctionsTable.tsx"],
    ["tables/CallTreeTables.tsx", "tables/components/CallTreeTables.tsx"],
    ["tables/callTreeCallTableAccessors.ts", "tables/model/callTreeCallTableAccessors.ts"],
    ["tables/callTreeFunctionTableAccessors.ts", "tables/model/callTreeFunctionTableAccessors.ts"],
    ["tables/callTreeTableFieldUtils.ts", "tables/model/callTreeTableFieldUtils.ts"],
    ["selectors/callTreeSelectors.ts", "model/callTreeSelectors.ts"],
    ["types/callTreeWorkspaceTypes.ts", "model/callTreeWorkspaceTypes.ts"],
    ["call-tree-state.ts", "state/call-tree-state.ts"],
  ],
  exactBarrelFiles: new Map([
    [
      "workspace/components/index.ts",
      [
        'export * from "./CallTreeWorkspace";',
        'export * from "./CallTreeHeroCard";',
        'export * from "./CallTreeResultsSection";',
        'export * from "./CallTreeStatusAlerts";',
        'export * from "./CallTreeSummaryCard";',
        "",
      ].join("\n"),
    ],
    ["workspace/hooks/index.ts", 'export * from "./useCallTreeActions";\n'],
    ["workspace/index.ts", 'export * from "./components";\nexport * from "./hooks";\n'],
    [
      "graph/components/index.ts",
      [
        'export * from "./CallTreeGraph";',
        'export * from "./CallTreeGraphCanvas";',
        'export * from "./CallTreeGraphEmptyState";',
        'export * from "./CallTreeGraphHeader";',
        'export * from "./CallTreeGraphInfo";',
        'export * from "./CallTreeGraphRenderers";',
        'export * from "./CallTreeGraphSelectedNode";',
        'export * from "./CallTreeGraphSidebar";',
        "",
      ].join("\n"),
    ],
    [
      "graph/model/index.ts",
      [
        'export * from "./callTreeGraphConstants";',
        'export * from "./callTreeGraphData";',
        'export * from "./callTreeGraphLayout";',
        'export * from "./callTreeGraphReadUtils";',
        'export * from "./callTreeGraphTypes";',
        "",
      ].join("\n"),
    ],
    ["graph/index.ts", 'export * from "./components";\nexport * from "./model";\n'],
    [
      "tables/components/index.ts",
      [
        'export * from "./CallTreeCallsTable";',
        'export * from "./CallTreeFunctionsTable";',
        'export * from "./CallTreeTables";',
        "",
      ].join("\n"),
    ],
    [
      "tables/model/index.ts",
      [
        'export * from "./callTreeCallTableAccessors";',
        'export * from "./callTreeFunctionTableAccessors";',
        'export * from "./callTreeTableFieldUtils";',
        "",
      ].join("\n"),
    ],
    ["tables/index.ts", 'export * from "./components";\nexport * from "./model";\n'],
    ["model/index.ts", 'export * from "./callTreeSelectors";\nexport * from "./callTreeWorkspaceTypes";\n'],
    ["state/index.ts", 'export * from "./call-tree-state";\n'],
    [
      "index.ts",
      [
        'export * from "./workspace";',
        'export * from "./graph";',
        'export * from "./tables";',
        'export * from "./model";',
        'export * from "./state";',
        "",
      ].join("\n"),
    ],
  ]),
  extraOldDirectories: ["components", "hooks", "selectors", "types"],
  expectedResult: [
    "workspace/components|hooks contains page shell and actions",
    "graph/components|model contains graph UI and graph data helpers",
    "tables/components|model contains table UI and table accessors",
    "model contains selectors and workspace types",
    "state contains call-tree-state",
  ],
});
