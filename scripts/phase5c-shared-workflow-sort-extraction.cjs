#!/usr/bin/env node

/*
  OROSAITOOLS cleanup — Phase 5C shared workflow sort extraction.

  Purpose:
  - Extract the generic stable topological-sort behavior used by
    resolveVisualWorkflowOrder into src/shared/workflow.
  - Keep custom-tools-specific validation/messages/types in custom-tools.
  - Do not move canvas layout, viewport, connection UI, or editor code.

  Run from the repo root:
    node .\scripts\phase5c-shared-workflow-sort-extraction.cjs
    npm run build

  Run Phase 5A first so src/shared/workflow exists.
*/

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");
const sharedWorkflowRoot = path.join(srcRoot, "shared", "workflow");
const customToolsRoot = path.join(srcRoot, "features", "custom-tools");
const resolveVisualWorkflowOrderPath = path.join(
  customToolsRoot,
  "workflow",
  "graph",
  "resolveVisualWorkflowOrder.ts",
);

function assertRepoRoot() {
  const packageJsonPath = path.join(repoRoot, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Run this script from the repository root. Missing: ${packageJsonPath}`);
  }

  if (!fs.existsSync(srcRoot)) {
    throw new Error(`Missing src directory: ${srcRoot}`);
  }

  if (!fs.existsSync(path.join(sharedWorkflowRoot, "index.ts"))) {
    throw new Error(
      "Missing src/shared/workflow/index.ts. Run Phase 5A shared foundations first.",
    );
  }

  if (!fs.existsSync(resolveVisualWorkflowOrderPath)) {
    throw new Error(
      `Missing workflow resolver: ${path.relative(repoRoot, resolveVisualWorkflowOrderPath)}`,
    );
  }
}

function toPosixPath(filePath) {
  return filePath.replaceAll(path.sep, "/");
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
}

function writeUtf8IfChanged(filePath, content) {
  ensureDirForFile(filePath);

  const normalizedContent = content.replace(/\r\n/g, "\n");
  const previousContent = fs.existsSync(filePath) ? readUtf8(filePath) : null;

  if (previousContent === normalizedContent) {
    return false;
  }

  fs.writeFileSync(filePath, normalizedContent, "utf8");
  return true;
}

function appendExportIfMissing(indexFile, exportLine) {
  const previousContent = readUtf8(indexFile);
  const normalizedExportLine = exportLine.trim();

  if (previousContent.split("\n").some((line) => line.trim() === normalizedExportLine)) {
    return false;
  }

  const nextContent = `${previousContent.trimEnd()}\n${normalizedExportLine}\n`;
  fs.writeFileSync(indexFile, nextContent, "utf8");
  return true;
}

function buildStableTopologicalSortContent() {
  return `export type StableTopologicalSortEdge<TNodeId extends PropertyKey = string> = {
  from: TNodeId;
  to: TNodeId;
};

export type StableTopologicalSortOptions<TNodeId extends PropertyKey = string> = {
  nodeIds: readonly TNodeId[];
  edges: readonly StableTopologicalSortEdge<TNodeId>[];
  compareNodeIds?: (leftNodeId: TNodeId, rightNodeId: TNodeId) => number;
};

export type StableTopologicalSortResult<TNodeId extends PropertyKey = string> = {
  orderedNodeIds: TNodeId[];
  cyclicNodeIds: TNodeId[];
};

function defaultCompareNodeIds<TNodeId extends PropertyKey>(
  leftNodeId: TNodeId,
  rightNodeId: TNodeId,
) {
  return String(leftNodeId).localeCompare(String(rightNodeId));
}

function sortReadyNodeIds<TNodeId extends PropertyKey>(
  nodeIds: TNodeId[],
  compareNodeIds: (leftNodeId: TNodeId, rightNodeId: TNodeId) => number,
) {
  nodeIds.sort(compareNodeIds);
}

export function stableTopologicalSort<TNodeId extends PropertyKey>({
  nodeIds,
  edges,
  compareNodeIds = defaultCompareNodeIds,
}: StableTopologicalSortOptions<TNodeId>): StableTopologicalSortResult<TNodeId> {
  const knownNodeIds = new Set(nodeIds);
  const incomingCountByNodeId = new Map<TNodeId, number>();
  const outgoingByNodeId = new Map<TNodeId, TNodeId[]>();

  for (const nodeId of nodeIds) {
    incomingCountByNodeId.set(nodeId, 0);
    outgoingByNodeId.set(nodeId, []);
  }

  for (const edge of edges) {
    if (!knownNodeIds.has(edge.from) || !knownNodeIds.has(edge.to)) {
      continue;
    }

    incomingCountByNodeId.set(edge.to, (incomingCountByNodeId.get(edge.to) ?? 0) + 1);
    outgoingByNodeId.set(edge.from, [...(outgoingByNodeId.get(edge.from) ?? []), edge.to]);
  }

  for (const outgoingNodeIds of outgoingByNodeId.values()) {
    sortReadyNodeIds(outgoingNodeIds, compareNodeIds);
  }

  const readyNodeIds = nodeIds.filter((nodeId) => incomingCountByNodeId.get(nodeId) === 0);
  sortReadyNodeIds(readyNodeIds, compareNodeIds);

  const orderedNodeIds: TNodeId[] = [];

  while (readyNodeIds.length > 0) {
    const nodeId = readyNodeIds.shift();

    if (nodeId === undefined) {
      break;
    }

    orderedNodeIds.push(nodeId);

    for (const outgoingNodeId of outgoingByNodeId.get(nodeId) ?? []) {
      const nextIncomingCount = (incomingCountByNodeId.get(outgoingNodeId) ?? 0) - 1;
      incomingCountByNodeId.set(outgoingNodeId, nextIncomingCount);

      if (nextIncomingCount === 0) {
        readyNodeIds.push(outgoingNodeId);
        sortReadyNodeIds(readyNodeIds, compareNodeIds);
      }
    }
  }

  const orderedNodeIdSet = new Set(orderedNodeIds);
  const cyclicNodeIds = nodeIds.filter((nodeId) => !orderedNodeIdSet.has(nodeId));

  return {
    orderedNodeIds,
    cyclicNodeIds,
  };
}
`;
}

function buildResolveVisualWorkflowOrderContent() {
  return `import { stableTopologicalSort } from "@/shared/workflow";

import type {
  CustomToolBlock,
  CustomToolManifest,
  CustomToolWorkflowConnection,
} from "../../model/customToolTypes";

type VisualConnectionLike = Partial<CustomToolWorkflowConnection>;

type VisualWorkflowEdge = {
  from: string;
  to: string;
};

export type VisualWorkflowOrderMessage = {
  level: "info" | "warning" | "error";
  message: string;
};

export type VisualWorkflowOrderResult = {
  blocks: CustomToolBlock[];
  messages: VisualWorkflowOrderMessage[];
  usedVisualConnections: boolean;
  succeeded: boolean;
};

function getVisualConnections(tool: CustomToolManifest): VisualConnectionLike[] {
  return Array.isArray(tool.workflow.visualConnections) ? tool.workflow.visualConnections : [];
}

function createOriginalOrderComparator(originalIndexByBlockId: Map<string, number>) {
  return (leftBlockId: string, rightBlockId: string) => {
    return (
      (originalIndexByBlockId.get(leftBlockId) ?? Number.MAX_SAFE_INTEGER) -
      (originalIndexByBlockId.get(rightBlockId) ?? Number.MAX_SAFE_INTEGER)
    );
  };
}

function resolveVisualWorkflowEdges(
  visualConnections: VisualConnectionLike[],
  blockIds: Set<string>,
): {
  edges: VisualWorkflowEdge[];
  ignoredConnectionCount: number;
} {
  const edgeKeys = new Set<string>();
  const edges: VisualWorkflowEdge[] = [];
  let ignoredConnectionCount = 0;

  for (const connection of visualConnections) {
    const fromBlockId = connection.fromBlockId;
    const toBlockId = connection.toBlockId;

    if (
      typeof fromBlockId !== "string" ||
      typeof toBlockId !== "string" ||
      fromBlockId === toBlockId ||
      !blockIds.has(fromBlockId) ||
      !blockIds.has(toBlockId)
    ) {
      ignoredConnectionCount += 1;
      continue;
    }

    const edgeKey = \`\${fromBlockId}->\${toBlockId}\`;

    if (edgeKeys.has(edgeKey)) {
      continue;
    }

    edgeKeys.add(edgeKey);
    edges.push({
      from: fromBlockId,
      to: toBlockId,
    });
  }

  return {
    edges,
    ignoredConnectionCount,
  };
}

export function resolveVisualWorkflowOrder(
  tool: CustomToolManifest,
): VisualWorkflowOrderResult {
  const originalBlocks = tool.workflow.blocks;
  const originalIndexByBlockId = new Map(
    originalBlocks.map((block, index) => [block.id, index]),
  );
  const blockById = new Map(originalBlocks.map((block) => [block.id, block]));
  const blockIds = new Set(blockById.keys());
  const visualConnections = getVisualConnections(tool);

  if (originalBlocks.length === 0 || visualConnections.length === 0) {
    return {
      blocks: originalBlocks,
      messages: [],
      usedVisualConnections: false,
      succeeded: true,
    };
  }

  const { edges, ignoredConnectionCount } = resolveVisualWorkflowEdges(
    visualConnections,
    blockIds,
  );

  const messages: VisualWorkflowOrderMessage[] = [];

  if (edges.length === 0) {
    messages.push({
      level: "warning",
      message:
        "Visual workflow connections exist, but none connect current blocks. Using the block list order.",
    });

    return {
      blocks: originalBlocks,
      messages,
      usedVisualConnections: false,
      succeeded: true,
    };
  }

  if (ignoredConnectionCount > 0) {
    messages.push({
      level: "warning",
      message: \`Ignored \${ignoredConnectionCount} stale visual connection(s) while resolving workflow order.\`,
    });
  }

  const { orderedNodeIds, cyclicNodeIds } = stableTopologicalSort({
    nodeIds: originalBlocks.map((block) => block.id),
    edges,
    compareNodeIds: createOriginalOrderComparator(originalIndexByBlockId),
  });

  if (cyclicNodeIds.length > 0) {
    const cyclicNodeIdSet = new Set(cyclicNodeIds);
    const blockedBlockLabels = originalBlocks
      .filter((block) => cyclicNodeIdSet.has(block.id))
      .map((block) => block.label)
      .join(", ");

    messages.push({
      level: "error",
      message: \`Visual workflow order has a cycle or blocked path near: \${blockedBlockLabels}. Remove or reroute one of the arrows before running.\`,
    });

    return {
      blocks: originalBlocks,
      messages,
      usedVisualConnections: true,
      succeeded: false,
    };
  }

  messages.push({
    level: "info",
    message: \`Resolved workflow execution order from \${edges.length} visual connection(s).\`,
  });

  return {
    blocks: orderedNodeIds
      .map((blockId) => blockById.get(blockId))
      .filter((block): block is CustomToolBlock => Boolean(block)),
    messages,
    usedVisualConnections: true,
    succeeded: true,
  };
}
`;
}

function main() {
  assertRepoRoot();

  const changedFiles = [];

  const stableTopologicalSortPath = path.join(sharedWorkflowRoot, "stableTopologicalSort.ts");

  if (writeUtf8IfChanged(stableTopologicalSortPath, buildStableTopologicalSortContent())) {
    changedFiles.push(path.relative(repoRoot, stableTopologicalSortPath));
  }

  const sharedWorkflowIndexPath = path.join(sharedWorkflowRoot, "index.ts");

  if (appendExportIfMissing(sharedWorkflowIndexPath, 'export * from "./stableTopologicalSort";')) {
    changedFiles.push(path.relative(repoRoot, sharedWorkflowIndexPath));
  }

  if (writeUtf8IfChanged(resolveVisualWorkflowOrderPath, buildResolveVisualWorkflowOrderContent())) {
    changedFiles.push(path.relative(repoRoot, resolveVisualWorkflowOrderPath));
  }

  if (changedFiles.length === 0) {
    console.log("Phase 5C shared workflow sort extraction was already applied. No files changed.");
  } else {
    console.log("Updated shared workflow extraction files:");
    for (const filePath of changedFiles) {
      console.log(`  - ${toPosixPath(filePath)}`);
    }
  }

  console.log("\nNext commands:");
  console.log("  npm run build");
  console.log("\nExpected result:");
  console.log("  - stable topological sorting lives in src/shared/workflow");
  console.log("  - resolveVisualWorkflowOrder keeps custom-tools messages/types only");
  console.log("  - workflowConnections and canvas graph files remain feature-specific");
}

main();
