#!/usr/bin/env node

/*
  OROSAITOOLS cleanup — Phase 5B shared storage extraction.

  Purpose:
  - Add a shared Tauri JSON storage adapter under src/shared/storage.
  - Refactor custom-tools storage modules to use shared storage primitives.
  - Keep feature-specific keys and CustomToolManifest/session types inside custom-tools.
  - Do not touch validation yet.

  Run from the repo root:
    node .\scripts\phase5b-shared-storage-extraction.cjs
    npm run build

  Run Phase 5A first so src/shared/storage/createJsonStorage.ts exists.
*/

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");
const sharedStorageRoot = path.join(srcRoot, "shared", "storage");
const customToolsRoot = path.join(srcRoot, "features", "custom-tools");
const customToolsStorageRoot = path.join(customToolsRoot, "storage");

function assertRepoRoot() {
  const packageJsonPath = path.join(repoRoot, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Run this script from the repository root. Missing: ${packageJsonPath}`);
  }

  if (!fs.existsSync(srcRoot)) {
    throw new Error(`Missing src directory: ${srcRoot}`);
  }

  if (!fs.existsSync(path.join(sharedStorageRoot, "createJsonStorage.ts"))) {
    throw new Error(
      "Missing src/shared/storage/createJsonStorage.ts. Run Phase 5A shared foundations first.",
    );
  }

  if (!fs.existsSync(customToolsStorageRoot)) {
    throw new Error(`Missing custom-tools storage folder: ${customToolsStorageRoot}`);
  }
}

function toPosixPath(filePath) {
  return filePath.replaceAll(path.sep, "/");
}

function withoutExtension(filePath) {
  return filePath.replace(/\.(ts|tsx)$/, "");
}

function importSpecifier(fromFile, toFile) {
  let relativePath = path.relative(path.dirname(fromFile), withoutExtension(toFile));
  relativePath = toPosixPath(relativePath);

  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
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

function firstExistingImportTarget(candidates) {
  for (const candidate of candidates) {
    const absolutePath = path.join(customToolsRoot, candidate);

    if (fs.existsSync(absolutePath)) {
      return importSpecifier(
        path.join(customToolsStorageRoot, "customToolBuilderSessionStorage.ts"),
        absolutePath,
      );
    }
  }

  throw new Error(
    `Could not find any import target:\n${candidates.map((candidate) => `  - ${candidate}`).join("\n")}`,
  );
}

function buildTauriJsonStorageAdapterContent() {
  return `import { invoke } from "@tauri-apps/api/core";

import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

import type { AppDataDocument, NullableAppDataDocument } from "./appDataDocument";
import type { JsonStorageAdapter } from "./createJsonStorage";

export function createTauriJsonStorageAdapter(): JsonStorageAdapter {
  return {
    async read<TData>(key: string): Promise<NullableAppDataDocument<TData>> {
      return invoke<AppDataDocument<TData> | null>(tauriCommandNames.appDataRead, {
        key,
      });
    },

    async write<TData>(key: string, data: TData): Promise<void> {
      await invoke<void>(tauriCommandNames.appDataWrite, {
        key,
        data,
      });
    },

    async delete(key: string): Promise<void> {
      await invoke<void>(tauriCommandNames.appDataDelete, {
        key,
      });
    },
  };
}
`;
}

function buildCustomToolDraftStorageContent() {
  return `import {
  createJsonStorage,
  createStorageLogger,
  createTauriJsonStorageAdapter,
} from "@/shared/storage";

import type { CustomToolManifest } from "../model/customToolTypes";

const CURRENT_DRAFT_KEY = "custom_tools.current_draft";

const currentDraftStorage = createJsonStorage<CustomToolManifest | null>({
  key: CURRENT_DRAFT_KEY,
  adapter: createTauriJsonStorageAdapter(),
  fallbackData: () => null,
  logger: createStorageLogger("custom-tools-storage"),
});

export async function loadCurrentCustomToolDraft() {
  return currentDraftStorage.load();
}

export async function saveCurrentCustomToolDraft(draft: CustomToolManifest) {
  await currentDraftStorage.save(draft);
}

export async function deleteCurrentCustomToolDraft() {
  await currentDraftStorage.delete();
}
`;
}

function buildBuilderSessionStorageContent() {
  const workflowSessionImport = firstExistingImportTarget([
    "workflow/editor/CustomToolWorkflowEditor.tsx",
    "workflow/editor/CustomToolWorkflowEditor.ts",
    "blockEditor/CustomToolWorkflowEditor.tsx",
  ]);

  const testPanelImport = firstExistingImportTarget([
    "runtime/components/CustomToolTestPanel.tsx",
    "testRun/CustomToolTestPanel.tsx",
  ]);

  return `import {
  createJsonStorage,
  createStorageLogger,
  createTauriJsonStorageAdapter,
} from "@/shared/storage";

import type { BuilderWorkspaceStage } from "../BuilderWorkspaceTabs";
import type { CustomToolWorkflowEditorSession } from "${workflowSessionImport}";
import type { CustomToolTestPanelSession } from "${testPanelImport}";

const CURRENT_BUILDER_SESSION_KEY = "custom_tools.builder_session";

export type CustomToolBuilderSession = {
  schemaVersion: 1;
  activeStage: BuilderWorkspaceStage;
  workflowSessionByDraftId: Record<string, CustomToolWorkflowEditorSession>;
  testSessionByDraftId: Record<string, CustomToolTestPanelSession>;
};

const builderSessionStorage = createJsonStorage<CustomToolBuilderSession | null>({
  key: CURRENT_BUILDER_SESSION_KEY,
  adapter: createTauriJsonStorageAdapter(),
  fallbackData: () => null,
  logger: createStorageLogger("custom-tools-builder-session-storage"),
});

export async function loadCustomToolBuilderSession() {
  return builderSessionStorage.load();
}

export async function saveCustomToolBuilderSession(
  session: CustomToolBuilderSession,
) {
  await builderSessionStorage.save(session);
}

export async function deleteCustomToolBuilderSession() {
  await builderSessionStorage.delete();
}
`;
}

function buildPublishedStorageContent() {
  return `import { removeEntityById, upsertEntityById } from "@/shared/entities";
import {
  createJsonStorage,
  createStorageLogger,
  createTauriJsonStorageAdapter,
} from "@/shared/storage";

import type { CustomToolManifest } from "../model/customToolTypes";

const PUBLISHED_TOOLS_KEY = "custom_tools.published_tools";

type PublishedToolsData = {
  tools: CustomToolManifest[];
};

function createEmptyPublishedToolsData(): PublishedToolsData {
  return {
    tools: [],
  };
}

const publishedToolsStorage = createJsonStorage<PublishedToolsData>({
  key: PUBLISHED_TOOLS_KEY,
  adapter: createTauriJsonStorageAdapter(),
  fallbackData: createEmptyPublishedToolsData,
  logger: createStorageLogger("custom-tools-storage"),
});

export async function loadPublishedCustomTools() {
  const data = await publishedToolsStorage.load();
  return data.tools;
}

export async function savePublishedCustomTools(tools: CustomToolManifest[]) {
  await publishedToolsStorage.save({
    ...createEmptyPublishedToolsData(),
    tools,
  });
}

export async function upsertPublishedCustomTool(tool: CustomToolManifest) {
  const tools = await loadPublishedCustomTools();
  await savePublishedCustomTools(upsertEntityById(tools, tool));
}

export async function deletePublishedCustomTool(toolId: string) {
  const tools = await loadPublishedCustomTools();
  const nextTools = removeEntityById(tools, toolId);

  await savePublishedCustomTools(nextTools);

  return nextTools;
}
`;
}

function main() {
  assertRepoRoot();

  const changedFiles = [];

  const adapterFile = path.join(sharedStorageRoot, "createTauriJsonStorageAdapter.ts");
  if (writeUtf8IfChanged(adapterFile, buildTauriJsonStorageAdapterContent())) {
    changedFiles.push(path.relative(repoRoot, adapterFile));
  }

  const sharedStorageIndex = path.join(sharedStorageRoot, "index.ts");
  if (appendExportIfMissing(sharedStorageIndex, 'export * from "./createTauriJsonStorageAdapter";')) {
    changedFiles.push(path.relative(repoRoot, sharedStorageIndex));
  }

  const customToolDraftStorage = path.join(customToolsStorageRoot, "customToolDraftStorage.ts");
  if (writeUtf8IfChanged(customToolDraftStorage, buildCustomToolDraftStorageContent())) {
    changedFiles.push(path.relative(repoRoot, customToolDraftStorage));
  }

  const builderSessionStorage = path.join(customToolsStorageRoot, "customToolBuilderSessionStorage.ts");
  if (writeUtf8IfChanged(builderSessionStorage, buildBuilderSessionStorageContent())) {
    changedFiles.push(path.relative(repoRoot, builderSessionStorage));
  }

  const publishedStorage = path.join(customToolsStorageRoot, "publishedCustomToolsStorage.ts");
  if (writeUtf8IfChanged(publishedStorage, buildPublishedStorageContent())) {
    changedFiles.push(path.relative(repoRoot, publishedStorage));
  }

  if (changedFiles.length === 0) {
    console.log("Phase 5B shared storage extraction was already applied. No files changed.");
  } else {
    console.log("Updated shared storage extraction files:");
    for (const filePath of changedFiles) {
      console.log(`  - ${toPosixPath(filePath)}`);
    }
  }

  console.log("\nNext commands:");
  console.log("  npm run build");
  console.log("\nExpected result:");
  console.log("  - app-data invoke logic is centralized in src/shared/storage/createTauriJsonStorageAdapter.ts");
  console.log("  - custom-tools storage files keep only feature keys/types and small load/save/delete wrappers");
  console.log("  - published tools uses shared entity helpers for upsert/delete");
}

main();
