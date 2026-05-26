#!/usr/bin/env node

/*
  OROSAITOOLS cleanup — Phase 5A shared foundations.

  Purpose:
  - Create a reusable src/shared foundation before extracting custom-tools code.
  - Keep this patch safe: it does not rewrite feature imports yet.
  - Avoid overwriting existing shared files with different content.

  Run from the repo root:
    node .\scripts\phase5a-shared-foundations.cjs
    npm run build

  After this passes, the next patches can move proven generic helpers into these
  modules and migrate feature imports gradually.
*/

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");

const files = new Map([
  [
    "src/shared/guards/isRecord.ts",
    `export type UnknownRecord = Record<PropertyKey, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasOwnKey<TKey extends PropertyKey>(
  value: unknown,
  key: TKey,
): value is UnknownRecord & Record<TKey, unknown> {
  return isRecord(value) && Object.prototype.hasOwnProperty.call(value, key);
}
`,
  ],
  [
    "src/shared/guards/primitive.ts",
    `export type Primitive = string | number | boolean | bigint | symbol | null | undefined;

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isPrimitive(value: unknown): value is Primitive {
  return value === null || (typeof value !== "object" && typeof value !== "function");
}
`,
  ],
  [
    "src/shared/guards/arrays.ts",
    `export function isArrayOf<TItem>(
  value: unknown,
  itemGuard: (item: unknown) => item is TItem,
): value is TItem[] {
  return Array.isArray(value) && value.every(itemGuard);
}

export function compact<TItem>(items: readonly (TItem | null | undefined)[]): TItem[] {
  return items.filter((item): item is TItem => item !== null && item !== undefined);
}

export function uniqueBy<TItem, TKey>(
  items: readonly TItem[],
  getKey: (item: TItem) => TKey,
): TItem[] {
  const seenKeys = new Set<TKey>();
  const uniqueItems: TItem[] = [];

  for (const item of items) {
    const key = getKey(item);

    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

export function hasDuplicates<TItem>(items: readonly TItem[]): boolean {
  return new Set(items).size !== items.length;
}
`,
  ],
  [
    "src/shared/guards/index.ts",
    `export * from "./arrays";
export * from "./isRecord";
export * from "./primitive";
`,
  ],
  [
    "src/shared/entities/ids.ts",
    `export type EntityId = string;

export function createEntityId(prefix?: string): EntityId {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return prefix ? \`\${prefix}_\${randomId}\` : randomId;
}

export function isEntityId(value: unknown): value is EntityId {
  return typeof value === "string" && value.trim().length > 0;
}
`,
  ],
  [
    "src/shared/entities/collection.ts",
    `export type EntityWithId<TId extends PropertyKey = string> = {
  id: TId;
};

export function findEntityById<TEntity extends EntityWithId<TId>, TId extends PropertyKey>(
  entities: readonly TEntity[],
  id: TId,
): TEntity | undefined {
  return entities.find((entity) => entity.id === id);
}

export function upsertEntityById<TEntity extends EntityWithId<TId>, TId extends PropertyKey>(
  entities: readonly TEntity[],
  entity: TEntity,
): TEntity[] {
  const existingIndex = entities.findIndex((item) => item.id === entity.id);

  if (existingIndex === -1) {
    return [...entities, entity];
  }

  return entities.map((item, index) => (index === existingIndex ? entity : item));
}

export function removeEntityById<TEntity extends EntityWithId<TId>, TId extends PropertyKey>(
  entities: readonly TEntity[],
  id: TId,
): TEntity[] {
  return entities.filter((entity) => entity.id !== id);
}

export function replaceEntityById<TEntity extends EntityWithId<TId>, TId extends PropertyKey>(
  entities: readonly TEntity[],
  id: TId,
  updateEntity: (entity: TEntity) => TEntity,
): TEntity[] {
  return entities.map((entity) => (entity.id === id ? updateEntity(entity) : entity));
}
`,
  ],
  [
    "src/shared/entities/selection.ts",
    `export type EntitySelection<TId extends PropertyKey = string> = ReadonlySet<TId>;

export function createEmptySelection<TId extends PropertyKey = string>(): EntitySelection<TId> {
  return new Set<TId>();
}

export function selectOnly<TId extends PropertyKey>(id: TId): EntitySelection<TId> {
  return new Set([id]);
}

export function toggleSelection<TId extends PropertyKey>(
  selection: EntitySelection<TId>,
  id: TId,
): EntitySelection<TId> {
  const nextSelection = new Set(selection);

  if (nextSelection.has(id)) {
    nextSelection.delete(id);
  } else {
    nextSelection.add(id);
  }

  return nextSelection;
}

export function removeFromSelection<TId extends PropertyKey>(
  selection: EntitySelection<TId>,
  id: TId,
): EntitySelection<TId> {
  const nextSelection = new Set(selection);
  nextSelection.delete(id);
  return nextSelection;
}

export function selectionToArray<TId extends PropertyKey>(
  selection: EntitySelection<TId>,
): TId[] {
  return [...selection];
}
`,
  ],
  [
    "src/shared/entities/index.ts",
    `export * from "./collection";
export * from "./ids";
export * from "./selection";
`,
  ],
  [
    "src/shared/storage/appDataDocument.ts",
    `export type AppDataDocument<TData> = {
  schemaVersion: number;
  key: string;
  updatedAtMs: number;
  data: TData;
};

export type NullableAppDataDocument<TData> = AppDataDocument<TData> | null;
`,
  ],
  [
    "src/shared/storage/storageLogger.ts",
    `export type StorageLogger = {
  info: (message: string, error?: unknown) => void;
  warn: (message: string, error?: unknown) => void;
};

export function createStorageLogger(namespace: string): StorageLogger {
  return {
    info(message, error) {
      console.info(\`[\${namespace}] \${message}\`, error);
    },
    warn(message, error) {
      console.warn(\`[\${namespace}] \${message}\`, error);
    },
  };
}
`,
  ],
  [
    "src/shared/storage/saveStatus.ts",
    `export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type SaveState = {
  status: SaveStatus;
  updatedAtMs: number | null;
  errorMessage: string | null;
};

export function createIdleSaveState(): SaveState {
  return {
    status: "idle",
    updatedAtMs: null,
    errorMessage: null,
  };
}

export function createSavingState(previousState: SaveState): SaveState {
  return {
    ...previousState,
    status: "saving",
    errorMessage: null,
  };
}

export function createSavedState(updatedAtMs = Date.now()): SaveState {
  return {
    status: "saved",
    updatedAtMs,
    errorMessage: null,
  };
}

export function createSaveErrorState(error: unknown): SaveState {
  return {
    status: "error",
    updatedAtMs: null,
    errorMessage: error instanceof Error ? error.message : "Unable to save changes.",
  };
}
`,
  ],
  [
    "src/shared/storage/storageGuards.ts",
    `import { hasOwnKey, isRecord } from "../guards";
import type { AppDataDocument } from "./appDataDocument";

export function isAppDataDocument<TData>(
  value: unknown,
  dataGuard: (data: unknown) => data is TData,
): value is AppDataDocument<TData> {
  return (
    isRecord(value) &&
    hasOwnKey(value, "schemaVersion") &&
    typeof value.schemaVersion === "number" &&
    hasOwnKey(value, "key") &&
    typeof value.key === "string" &&
    hasOwnKey(value, "updatedAtMs") &&
    typeof value.updatedAtMs === "number" &&
    hasOwnKey(value, "data") &&
    dataGuard(value.data)
  );
}
`,
  ],
  [
    "src/shared/storage/createJsonStorage.ts",
    `import type { AppDataDocument, NullableAppDataDocument } from "./appDataDocument";
import type { StorageLogger } from "./storageLogger";

export type JsonStorageAdapter = {
  read: <TData>(key: string) => Promise<NullableAppDataDocument<TData>>;
  write: <TData>(key: string, data: TData) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

export type JsonStorageOptions<TData> = {
  key: string;
  adapter: JsonStorageAdapter;
  fallbackData: () => TData;
  logger?: StorageLogger;
};

export type JsonStorage<TData> = {
  load: () => Promise<TData>;
  save: (data: TData) => Promise<void>;
  delete: () => Promise<void>;
};

export function createJsonStorage<TData>({
  key,
  adapter,
  fallbackData,
  logger,
}: JsonStorageOptions<TData>): JsonStorage<TData> {
  return {
    async load() {
      try {
        const document: AppDataDocument<TData> | null = await adapter.read<TData>(key);
        return document?.data ?? fallbackData();
      } catch (error) {
        logger?.info("Unable to load stored data. Falling back to default data.", error);
        return fallbackData();
      }
    },

    async save(data) {
      await adapter.write<TData>(key, data);
    },

    async delete() {
      try {
        await adapter.delete(key);
      } catch (error) {
        logger?.info("No stored data to delete.", error);
      }
    },
  };
}
`,
  ],
  [
    "src/shared/storage/index.ts",
    `export * from "./appDataDocument";
export * from "./createJsonStorage";
export * from "./saveStatus";
export * from "./storageGuards";
export * from "./storageLogger";
`,
  ],
  [
    "src/shared/workflow/directedGraph.ts",
    `export type DirectedGraph<TNodeId extends PropertyKey = string> = {
  nodes: readonly TNodeId[];
  edges: readonly DirectedGraphEdge<TNodeId>[];
};

export type DirectedGraphEdge<TNodeId extends PropertyKey = string> = {
  from: TNodeId;
  to: TNodeId;
};

export function getOutgoingNodeIds<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
  nodeId: TNodeId,
): TNodeId[] {
  return graph.edges.filter((edge) => edge.from === nodeId).map((edge) => edge.to);
}

export function getIncomingNodeIds<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
  nodeId: TNodeId,
): TNodeId[] {
  return graph.edges.filter((edge) => edge.to === nodeId).map((edge) => edge.from);
}

export function getNodeIdSet<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
): Set<TNodeId> {
  return new Set(graph.nodes);
}
`,
  ],
  [
    "src/shared/workflow/topologicalSort.ts",
    `import type { DirectedGraph } from "./directedGraph";

export type TopologicalSortResult<TNodeId extends PropertyKey = string> = {
  orderedNodeIds: TNodeId[];
  cyclicNodeIds: TNodeId[];
};

export function topologicalSort<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
): TopologicalSortResult<TNodeId> {
  const incomingCountByNodeId = new Map<TNodeId, number>();
  const outgoingByNodeId = new Map<TNodeId, TNodeId[]>();

  for (const nodeId of graph.nodes) {
    incomingCountByNodeId.set(nodeId, 0);
    outgoingByNodeId.set(nodeId, []);
  }

  for (const edge of graph.edges) {
    incomingCountByNodeId.set(edge.to, (incomingCountByNodeId.get(edge.to) ?? 0) + 1);
    outgoingByNodeId.set(edge.from, [...(outgoingByNodeId.get(edge.from) ?? []), edge.to]);
  }

  const readyNodeIds = graph.nodes.filter((nodeId) => incomingCountByNodeId.get(nodeId) === 0);
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
      }
    }
  }

  const orderedNodeIdSet = new Set(orderedNodeIds);
  const cyclicNodeIds = graph.nodes.filter((nodeId) => !orderedNodeIdSet.has(nodeId));

  return {
    orderedNodeIds,
    cyclicNodeIds,
  };
}
`,
  ],
  [
    "src/shared/workflow/graphValidation.ts",
    `import type { DirectedGraph, DirectedGraphEdge } from "./directedGraph";
import { topologicalSort } from "./topologicalSort";

export function findEdgesWithMissingNodes<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
): DirectedGraphEdge<TNodeId>[] {
  const nodeIds = new Set(graph.nodes);

  return graph.edges.filter((edge) => !nodeIds.has(edge.from) || !nodeIds.has(edge.to));
}

export function findDuplicateNodeIds<TNodeId extends PropertyKey>(
  nodeIds: readonly TNodeId[],
): TNodeId[] {
  const seenNodeIds = new Set<TNodeId>();
  const duplicateNodeIds = new Set<TNodeId>();

  for (const nodeId of nodeIds) {
    if (seenNodeIds.has(nodeId)) {
      duplicateNodeIds.add(nodeId);
    }

    seenNodeIds.add(nodeId);
  }

  return [...duplicateNodeIds];
}

export function findCyclicNodeIds<TNodeId extends PropertyKey>(
  graph: DirectedGraph<TNodeId>,
): TNodeId[] {
  return topologicalSort(graph).cyclicNodeIds;
}
`,
  ],
  [
    "src/shared/workflow/index.ts",
    `export * from "./directedGraph";
export * from "./graphValidation";
export * from "./topologicalSort";
`,
  ],
  [
    "src/shared/index.ts",
    `export * from "./entities";
export * from "./guards";
export * from "./storage";
export * from "./workflow";
`,
  ],
]);

function assertRepoRoot() {
  const packageJsonPath = path.join(repoRoot, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Run this script from the repository root. Missing: ${packageJsonPath}`);
  }

  if (!fs.existsSync(srcRoot)) {
    throw new Error(`Missing src directory: ${srcRoot}`);
  }
}

function normalizeContent(content) {
  return content.replace(/\r\n/g, "\n");
}

function writeFileIfSafe(relativePath, content) {
  const filePath = path.join(repoRoot, relativePath);
  const normalizedContent = normalizeContent(content);

  if (fs.existsSync(filePath)) {
    const existingContent = normalizeContent(fs.readFileSync(filePath, "utf8"));

    if (existingContent !== normalizedContent) {
      throw new Error(
        `Refusing to overwrite existing file with different content: ${relativePath}\n` +
          "Review that file manually, then rerun if you want this shared foundation applied.",
      );
    }

    return false;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, normalizedContent, "utf8");
  return true;
}

function main() {
  assertRepoRoot();

  const createdFiles = [];
  const unchangedFiles = [];

  for (const [relativePath, content] of files) {
    if (writeFileIfSafe(relativePath, content)) {
      createdFiles.push(relativePath);
    } else {
      unchangedFiles.push(relativePath);
    }
  }

  if (createdFiles.length > 0) {
    console.log("Created shared foundation files:");
    for (const filePath of createdFiles) {
      console.log(`  - ${filePath}`);
    }
  }

  if (unchangedFiles.length > 0) {
    console.log("\nAlready up to date:");
    for (const filePath of unchangedFiles) {
      console.log(`  - ${filePath}`);
    }
  }

  console.log("\nNext commands:");
  console.log("  npm run build");
  console.log("\nExpected result:");
  console.log("  - src/shared exists");
  console.log("  - shared modules compile");
  console.log("  - no feature imports changed yet");
  console.log("\nNext cleanup after this passes:");
  console.log("  - migrate duplicated storage document/logger helpers into src/shared/storage");
  console.log("  - migrate safe generic graph helpers into src/shared/workflow");
  console.log("  - keep custom-tools-specific validation in src/features/custom-tools/validation");
}

main();
