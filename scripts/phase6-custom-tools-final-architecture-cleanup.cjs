#!/usr/bin/env node

/*
  OROSAITOOLS custom-tools cleanup — Phase 6 final architecture cleanup.

  Purpose:
  - Clean the remaining messy custom-tools folders in one pass.
  - Move flat builder, history, hooks, inputPicker, runner, storage, templates,
    and validation files into domain-oriented folders.
  - Rewrite relative imports by resolving the actual local file graph.
  - Do NOT leave compatibility shims.
  - Refuse to overwrite local edits when an old source and new target both exist
    with different non-shim content.

  Run from the repo root:
    node .\scripts\phase6-custom-tools-final-architecture-cleanup.cjs
    npm run build

  Recommended before running:
    git status --short
*/

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");
const customToolsRoot = path.join(srcRoot, "features", "custom-tools");

const sourceExtensions = [".ts", ".tsx"];
const sourceExtensionSet = new Set(sourceExtensions);

const plannedMoves = [
  // Builder shell.
  ["BuilderHero.tsx", "builder/components/BuilderHero.tsx"],
  ["BuilderRoadmap.tsx", "builder/components/BuilderRoadmap.tsx"],
  ["BuilderWorkspaceTabs.tsx", "builder/components/BuilderWorkspaceTabs.tsx"],
  ["CustomToolBuilderWorkspace.tsx", "builder/components/CustomToolBuilderWorkspace.tsx"],
  ["DraftActions.tsx", "builder/components/DraftActions.tsx"],
  ["StarterBlockCatalog.tsx", "builder/components/StarterBlockCatalog.tsx"],
  ["ToolDraftSummary.tsx", "builder/components/ToolDraftSummary.tsx"],
  ["ToolMetadataEditor.tsx", "builder/components/ToolMetadataEditor.tsx"],
  ["builderData.ts", "builder/model/builderData.ts"],

  // Builder persistence hooks.
  ["hooks/usePersistedCustomToolBuilderSession.ts", "builder/hooks/usePersistedCustomToolBuilderSession.ts"],
  ["hooks/usePersistedCustomToolDraft.ts", "builder/hooks/usePersistedCustomToolDraft.ts"],

  // History feature.
  ["history/CustomToolRunHistoryPanel.tsx", "history/components/CustomToolRunHistoryPanel.tsx"],
  ["history/createCustomToolRunHistoryEntry.ts", "history/model/createCustomToolRunHistoryEntry.ts"],
  ["history/customToolRunHistoryTypes.ts", "history/model/customToolRunHistoryTypes.ts"],
  ["history/customToolRunHistoryStorage.ts", "history/storage/customToolRunHistoryStorage.ts"],

  // File/path picking.
  ["inputPicker/selectCustomToolPath.ts", "files/picker/selectCustomToolPath.ts"],

  // Runner feature.
  ["runner/CustomToolRunnerWorkspace.tsx", "runner/components/CustomToolRunnerWorkspace.tsx"],
  ["runner/RunnerDryRunCard.tsx", "runner/components/RunnerDryRunCard.tsx"],
  ["runner/RunnerInputForm.tsx", "runner/components/RunnerInputForm.tsx"],
  ["runner/RunnerRealExecutionCard.tsx", "runner/components/RunnerRealExecutionCard.tsx"],
  ["runner/runnerToolResolver.ts", "runner/model/runnerToolResolver.ts"],

  // Feature persistence. Generic storage belongs in src/shared/storage; these are custom-tools policies.
  ["storage/customToolBuilderSessionStorage.ts", "persistence/customToolBuilderSessionStorage.ts"],
  ["storage/customToolDraftStorage.ts", "persistence/customToolDraftStorage.ts"],
  ["storage/publishedCustomToolsStorage.ts", "persistence/publishedCustomToolsStorage.ts"],

  // Runtime templates.
  ["templates/historyUpdaterTemplate.ts", "runtime/templates/historyUpdaterTemplate.ts"],

  // Validation feature.
  ["validation/CustomToolValidationPanel.tsx", "validation/components/CustomToolValidationPanel.tsx"],
  ["validation/validationTypes.ts", "validation/model/validationTypes.ts"],
  ["validation/validationHelpers.ts", "validation/model/validationHelpers.ts"],
  ["validation/blockReferenceValidation.ts", "validation/rules/blockReferenceValidation.ts"],
  ["validation/customToolValidation.ts", "validation/rules/customToolValidation.ts"],
  ["validation/validateBlocks.ts", "validation/rules/validateBlocks.ts"],
  ["validation/validateInputs.ts", "validation/rules/validateInputs.ts"],
  ["validation/validatePermissions.ts", "validation/rules/validatePermissions.ts"],
  ["validation/validateToolIdentity.ts", "validation/rules/validateToolIdentity.ts"],
  ["validation/validateWorkflowConnections.ts", "validation/rules/validateWorkflowConnections.ts"],
];

const exactBarrelFiles = new Map([
  [
    "builder/components/index.ts",
    [
      "export * from \"./BuilderHero\";",
      "export * from \"./BuilderRoadmap\";",
      "export * from \"./BuilderWorkspaceTabs\";",
      "export * from \"./CustomToolBuilderWorkspace\";",
      "export * from \"./DraftActions\";",
      "export * from \"./StarterBlockCatalog\";",
      "export * from \"./ToolDraftSummary\";",
      "export * from \"./ToolMetadataEditor\";",
      "",
    ].join("\n"),
  ],
  [
    "builder/hooks/index.ts",
    [
      "export * from \"./usePersistedCustomToolBuilderSession\";",
      "export * from \"./usePersistedCustomToolDraft\";",
      "",
    ].join("\n"),
  ],
  [
    "builder/model/index.ts",
    [
      "export * from \"./builderData\";",
      "",
    ].join("\n"),
  ],
  [
    "builder/index.ts",
    [
      "export * from \"./components\";",
      "export * from \"./hooks\";",
      "export * from \"./model\";",
      "",
    ].join("\n"),
  ],
  [
    "history/components/index.ts",
    [
      "export * from \"./CustomToolRunHistoryPanel\";",
      "",
    ].join("\n"),
  ],
  [
    "history/model/index.ts",
    [
      "export * from \"./createCustomToolRunHistoryEntry\";",
      "export * from \"./customToolRunHistoryTypes\";",
      "",
    ].join("\n"),
  ],
  [
    "history/storage/index.ts",
    [
      "export * from \"./customToolRunHistoryStorage\";",
      "",
    ].join("\n"),
  ],
  [
    "history/index.ts",
    [
      "export * from \"./components\";",
      "export * from \"./model\";",
      "export * from \"./storage\";",
      "",
    ].join("\n"),
  ],
  [
    "runner/components/index.ts",
    [
      "export * from \"./CustomToolRunnerWorkspace\";",
      "export * from \"./RunnerDryRunCard\";",
      "export * from \"./RunnerInputForm\";",
      "export * from \"./RunnerRealExecutionCard\";",
      "",
    ].join("\n"),
  ],
  [
    "runner/model/index.ts",
    [
      "export * from \"./runnerToolResolver\";",
      "",
    ].join("\n"),
  ],
  [
    "runner/index.ts",
    [
      "export * from \"./components\";",
      "export * from \"./model\";",
      "",
    ].join("\n"),
  ],
  [
    "files/picker/index.ts",
    [
      "export * from \"./selectCustomToolPath\";",
      "",
    ].join("\n"),
  ],
  [
    "files/index.ts",
    [
      "export * from \"./picker\";",
      "",
    ].join("\n"),
  ],
  [
    "persistence/index.ts",
    [
      "export * from \"./customToolBuilderSessionStorage\";",
      "export * from \"./customToolDraftStorage\";",
      "export * from \"./publishedCustomToolsStorage\";",
      "",
    ].join("\n"),
  ],
  [
    "validation/components/index.ts",
    [
      "export * from \"./CustomToolValidationPanel\";",
      "",
    ].join("\n"),
  ],
  [
    "validation/model/index.ts",
    [
      "export * from \"./validationHelpers\";",
      "export * from \"./validationTypes\";",
      "",
    ].join("\n"),
  ],
  [
    "validation/rules/index.ts",
    [
      "export * from \"./blockReferenceValidation\";",
      "export * from \"./customToolValidation\";",
      "export * from \"./validateBlocks\";",
      "export * from \"./validateInputs\";",
      "export * from \"./validatePermissions\";",
      "export * from \"./validateToolIdentity\";",
      "export * from \"./validateWorkflowConnections\";",
      "",
    ].join("\n"),
  ],
  [
    "validation/index.ts",
    [
      "export * from \"./components\";",
      "export * from \"./model\";",
      "export * from \"./rules\";",
      "",
    ].join("\n"),
  ],
]);

const appendOnlyBarrelExports = new Map([
  [
    "runtime/templates/index.ts",
    [
      'export * from "./historyUpdaterTemplate";',
    ],
  ],
]);

const oldFlatDirectories = [
  path.join(customToolsRoot, "hooks"),
  path.join(customToolsRoot, "inputPicker"),
  path.join(customToolsRoot, "storage"),
  path.join(customToolsRoot, "templates"),
];

const oldFlatFileRootsToCheck = [
  path.join(customToolsRoot, "history"),
  path.join(customToolsRoot, "runner"),
  path.join(customToolsRoot, "validation"),
];

function assertRepoRoot() {
  const packageJsonPath = path.join(repoRoot, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Run this script from the repository root. Missing: ${packageJsonPath}`);
  }

  if (!fs.existsSync(srcRoot)) {
    throw new Error(`Missing src directory: ${srcRoot}`);
  }

  if (!fs.existsSync(customToolsRoot)) {
    throw new Error(`Missing custom-tools feature directory: ${customToolsRoot}`);
  }
}

function normalizePath(filePath) {
  return path.normalize(filePath);
}

function normalizeContent(content) {
  return content.replace(/\r\n/g, "\n");
}

function toPosixPath(filePath) {
  return filePath.replaceAll(path.sep, "/");
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readUtf8(filePath) {
  return normalizeContent(fs.readFileSync(filePath, "utf8"));
}

function writeUtf8(filePath, content) {
  ensureDirForFile(filePath);
  fs.writeFileSync(filePath, normalizeContent(content), "utf8");
}

function writeUtf8IfChanged(filePath, content) {
  const normalizedContent = normalizeContent(content);
  const previousContent = fs.existsSync(filePath) ? readUtf8(filePath) : null;

  if (previousContent === normalizedContent) {
    return false;
  }

  writeUtf8(filePath, normalizedContent);
  return true;
}

function isSourceFile(filePath) {
  return sourceExtensionSet.has(path.extname(filePath));
}

function walkSourceFiles(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }

      walkSourceFiles(fullPath, files);
      continue;
    }

    if (entry.isFile() && isSourceFile(fullPath)) {
      files.push(normalizePath(fullPath));
    }
  }

  return files;
}

function withoutSourceExtension(filePath) {
  const extension = path.extname(filePath);
  return sourceExtensionSet.has(extension) ? filePath.slice(0, -extension.length) : filePath;
}

function toImportSpecifier(fromFile, targetFile) {
  let relativePath = path.relative(path.dirname(fromFile), withoutSourceExtension(targetFile));
  relativePath = toPosixPath(relativePath);

  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

function isRelativeSpecifier(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

function createKnownFileSet(files) {
  return new Set(files.map(normalizePath));
}

function resolveLocalModule(fromFile, specifier, knownFiles) {
  if (!isRelativeSpecifier(specifier)) {
    return null;
  }

  const absoluteBase = normalizePath(path.resolve(path.dirname(fromFile), specifier));

  if (knownFiles.has(absoluteBase)) {
    return absoluteBase;
  }

  for (const extension of sourceExtensions) {
    const candidate = `${absoluteBase}${extension}`;

    if (knownFiles.has(candidate) || fs.existsSync(candidate)) {
      return normalizePath(candidate);
    }
  }

  for (const extension of sourceExtensions) {
    const candidate = path.join(absoluteBase, `index${extension}`);

    if (knownFiles.has(candidate) || fs.existsSync(candidate)) {
      return normalizePath(candidate);
    }
  }

  return null;
}

function replaceModuleSpecifiers(text, replacer) {
  let result = text;

  const patterns = [
    /(\bimport\s+type\s+[\s\S]*?\s+from\s*["'])([^"']+)(["'])/g,
    /(\bimport\s+[\s\S]*?\s+from\s*["'])([^"']+)(["'])/g,
    /(\bexport\s+type\s+[\s\S]*?\s+from\s*["'])([^"']+)(["'])/g,
    /(\bexport\s+[\s\S]*?\s+from\s*["'])([^"']+)(["'])/g,
    /(\bimport\s*["'])([^"']+)(["'])/g,
    /(\bimport\s*\(\s*["'])([^"']+)(["']\s*\))/g,
  ];

  for (const pattern of patterns) {
    result = result.replace(
      pattern,
      (match, before, specifier, after) => `${before}${replacer(specifier) ?? specifier}${after}`,
    );
  }

  return result;
}

function buildMoveMap() {
  const moveMap = new Map();

  for (const [fromRelative, toRelative] of plannedMoves) {
    const sourceFile = normalizePath(path.join(customToolsRoot, fromRelative));
    const targetFile = normalizePath(path.join(customToolsRoot, toRelative));
    moveMap.set(sourceFile, targetFile);
  }

  return moveMap;
}

function isCompatibilityShim(sourceFile, targetFile) {
  if (!fs.existsSync(sourceFile)) {
    return false;
  }

  const targetSpecifier = toImportSpecifier(sourceFile, targetFile);
  const sourceText = readUtf8(sourceFile).trim();

  const acceptedShims = new Set([
    `export * from "${targetSpecifier}";`,
    `export * from '${targetSpecifier}';`,
    [`export * from "${targetSpecifier}";`, `export { default } from "${targetSpecifier}";`].join("\n"),
    [`export * from '${targetSpecifier}';`, `export { default } from '${targetSpecifier}';`].join("\n"),
  ]);

  return acceptedShims.has(sourceText);
}

function prepareMoveConflicts(moveMap) {
  const conflicts = [];

  for (const [sourceFile, targetFile] of moveMap) {
    if (!fs.existsSync(sourceFile) || !fs.existsSync(targetFile)) {
      continue;
    }

    const sourceText = readUtf8(sourceFile);
    const targetText = readUtf8(targetFile);

    if (sourceText === targetText || isCompatibilityShim(sourceFile, targetFile)) {
      continue;
    }

    conflicts.push({
      sourceFile,
      targetFile,
    });
  }

  if (conflicts.length === 0) {
    return;
  }

  const details = conflicts
    .map(
      ({ sourceFile, targetFile }) =>
        `  - ${relativeRepoPath(sourceFile)} and ${relativeRepoPath(targetFile)} both exist with different content`,
    )
    .join("\n");

  throw new Error(
    "Refusing to overwrite local edits while final-cleaning custom-tools.\n" +
      details +
      "\nResolve those duplicate files manually, then rerun this script.",
  );
}

function rewriteAndMoveSources(moveMap) {
  prepareMoveConflicts(moveMap);

  const discoveredFiles = walkSourceFiles(srcRoot);
  const knownFiles = createKnownFileSet([...discoveredFiles, ...moveMap.values()]);

  const changedFiles = [];
  const movedFiles = [];
  const removedDuplicateOldSources = [];

  for (const filePath of discoveredFiles) {
    const movedTarget = moveMap.get(filePath);

    if (movedTarget && fs.existsSync(movedTarget)) {
      fs.rmSync(filePath, { force: true });
      removedDuplicateOldSources.push(filePath);
      continue;
    }

    const outputFile = movedTarget ?? filePath;
    const originalText = readUtf8(filePath);

    const rewrittenText = replaceModuleSpecifiers(originalText, (specifier) => {
      const resolvedTarget = resolveLocalModule(filePath, specifier, knownFiles);

      if (!resolvedTarget) {
        return null;
      }

      const finalTarget = moveMap.get(resolvedTarget) ?? resolvedTarget;
      const shouldRewrite = outputFile !== filePath || finalTarget !== resolvedTarget;

      if (!shouldRewrite) {
        return null;
      }

      return toImportSpecifier(outputFile, finalTarget);
    });

    if (outputFile !== filePath) {
      writeUtf8(outputFile, rewrittenText);
      fs.rmSync(filePath, { force: true });
      movedFiles.push([filePath, outputFile]);
    } else if (rewrittenText !== originalText) {
      writeUtf8(outputFile, rewrittenText);
      changedFiles.push(outputFile);
    }
  }

  return {
    changedFiles,
    movedFiles,
    removedDuplicateOldSources,
  };
}

function writeBarrelFiles() {
  const written = [];

  for (const [relativePath, content] of exactBarrelFiles) {
    const filePath = path.join(customToolsRoot, relativePath);

    if (writeUtf8IfChanged(filePath, content)) {
      written.push(filePath);
    }
  }

  for (const [relativePath, exportLines] of appendOnlyBarrelExports) {
    const filePath = path.join(customToolsRoot, relativePath);
    const previousContent = fs.existsSync(filePath) ? readUtf8(filePath) : "";

    const lines = previousContent
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let nextContent = previousContent.trimEnd();
    let changed = false;

    for (const exportLine of exportLines) {
      if (!lines.includes(exportLine)) {
        nextContent = `${nextContent}\n${exportLine}`.trimStart();
        changed = true;
      }
    }

    if (changed) {
      writeUtf8(filePath, `${nextContent}\n`);
      written.push(filePath);
    }
  }

  return written;
}

function removeEmptyDirectoryTree(dirPath, stopAtPath) {
  const removed = [];

  let currentPath = dirPath;

  while (
    fs.existsSync(currentPath) &&
    normalizePath(currentPath) !== normalizePath(stopAtPath) &&
    fs.statSync(currentPath).isDirectory() &&
    fs.readdirSync(currentPath).length === 0
  ) {
    fs.rmdirSync(currentPath);
    removed.push(currentPath);
    currentPath = path.dirname(currentPath);
  }

  return removed;
}

function cleanupOldDirectories() {
  const removed = [];

  for (const oldDir of oldFlatDirectories) {
    if (!fs.existsSync(oldDir)) {
      continue;
    }

    if (!fs.statSync(oldDir).isDirectory()) {
      continue;
    }

    if (fs.readdirSync(oldDir).length === 0) {
      fs.rmdirSync(oldDir);
      removed.push(oldDir);
    }
  }

  for (const [sourceFile] of buildMoveMap()) {
    const sourceDir = path.dirname(sourceFile);
    removed.push(...removeEmptyDirectoryTree(sourceDir, customToolsRoot));
  }

  return [...new Set(removed)];
}

function findRemainingOldFlatFiles() {
  const remaining = [];

  for (const oldDir of oldFlatDirectories) {
    if (fs.existsSync(oldDir)) {
      remaining.push(oldDir);
    }
  }

  for (const root of oldFlatFileRootsToCheck) {
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
      continue;
    }

    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      const entryPath = path.join(root, entry.name);

      if (entry.isFile() && isSourceFile(entryPath)) {
        remaining.push(entryPath);
      }
    }
  }

  for (const [sourceFile] of buildMoveMap()) {
    if (fs.existsSync(sourceFile)) {
      remaining.push(sourceFile);
    }
  }

  return [...new Set(remaining.map(normalizePath))];
}

function verifyNoImportsResolveToOldLocations(moveMap) {
  const files = walkSourceFiles(srcRoot);
  const knownFiles = createKnownFileSet(files);
  const remainingOldImports = [];

  for (const filePath of files) {
    const text = readUtf8(filePath);

    replaceModuleSpecifiers(text, (specifier) => {
      const resolved = resolveLocalModule(filePath, specifier, knownFiles);

      if (resolved && moveMap.has(resolved)) {
        remainingOldImports.push({
          filePath,
          specifier,
          resolved,
        });
      }

      return null;
    });
  }

  return remainingOldImports;
}

function relativeRepoPath(filePath) {
  return toPosixPath(path.relative(repoRoot, filePath));
}

function report(title, values) {
  if (values.length === 0) {
    return;
  }

  console.log(`\n${title}`);

  for (const value of values) {
    if (Array.isArray(value)) {
      console.log(`  - ${relativeRepoPath(value[0])} -> ${relativeRepoPath(value[1])}`);
    } else {
      console.log(`  - ${relativeRepoPath(value)}`);
    }
  }
}

function main() {
  assertRepoRoot();

  const moveMap = buildMoveMap();
  const { changedFiles, movedFiles, removedDuplicateOldSources } = rewriteAndMoveSources(moveMap);
  const barrelFiles = writeBarrelFiles();
  const removedDirectories = cleanupOldDirectories();
  const remainingOldFlatFiles = findRemainingOldFlatFiles();
  const remainingOldImports = verifyNoImportsResolveToOldLocations(moveMap);

  report("Moved files:", movedFiles);
  report("Updated imports in existing files:", changedFiles);
  report("Removed duplicate old source files:", removedDuplicateOldSources);
  report("Wrote barrel files:", barrelFiles);
  report("Removed empty old directories:", removedDirectories);

  if (remainingOldImports.length > 0) {
    console.error("\nSome imports still resolve to old flat custom-tools locations:");

    for (const item of remainingOldImports) {
      console.error(
        `  - ${relativeRepoPath(item.filePath)} imports "${item.specifier}" -> ${relativeRepoPath(item.resolved)}`,
      );
    }

    console.error("\nFix those imports, then rerun this script.");
    process.exitCode = 1;
    return;
  }

  if (remainingOldFlatFiles.length > 0) {
    console.warn("\nOld flat custom-tools files/folders still exist and were not deleted:");
    for (const item of remainingOldFlatFiles) {
      console.warn(`  - ${relativeRepoPath(item)}`);
    }
    console.warn("\nThese are likely local-only files not in the planned cleanup map. Review them manually.");
  }

  if (
    movedFiles.length === 0 &&
    changedFiles.length === 0 &&
    removedDuplicateOldSources.length === 0 &&
    barrelFiles.length === 0 &&
    removedDirectories.length === 0
  ) {
    console.log("Phase 6 final custom-tools architecture cleanup was already applied. No files changed.");
  }

  console.log("\nNext commands:");
  console.log("  npm run build");
  console.log("\nExpected clean shape:");
  console.log("  - builder/components|hooks|model");
  console.log("  - history/components|model|storage");
  console.log("  - runner/components|model");
  console.log("  - files/picker");
  console.log("  - persistence");
  console.log("  - validation/components|model|rules");
  console.log("  - runtime/templates includes historyUpdaterTemplate");
  console.log("  - no top-level hooks, inputPicker, storage, or templates folders");
}

main();
