#!/usr/bin/env node

/*
  OROSAITOOLS custom-tools runtime cleanup — Phase 2A.

  This script moves the old custom-tools testRun and execution modules into a
  runtime/* architecture, rewrites relative imports based on the actual local
  file graph, and leaves compatibility shims in the old folders.

  Run from the repo root:
    node .\scripts\phase2-runtime-cleanup.cjs
    npm run build
*/

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");
const customToolsRoot = path.join(srcRoot, "features", "custom-tools");

const sourceExtensions = [".ts", ".tsx"];
const sourceExtensionSet = new Set(sourceExtensions);

const plannedMoves = [
  ["testRun/CustomToolTestPanel.tsx", "runtime/components/CustomToolTestPanel.tsx"],
  ["testRun/TestRunAppendPreviews.tsx", "runtime/components/TestRunAppendPreviews.tsx"],
  ["testRun/TestRunBlockOutputs.tsx", "runtime/components/TestRunBlockOutputs.tsx"],
  ["testRun/TestRunExecutionPlan.tsx", "runtime/components/TestRunExecutionPlan.tsx"],
  ["testRun/TestRunInputField.tsx", "runtime/components/TestRunInputField.tsx"],
  ["testRun/TestRunLogs.tsx", "runtime/components/TestRunLogs.tsx"],

  ["testRun/runCustomToolDryRun.ts", "runtime/dry-run/runCustomToolDryRun.ts"],
  ["testRun/dryRunBasicBlocks.ts", "runtime/dry-run/dryRunBasicBlocks.ts"],
  ["testRun/dryRunContext.ts", "runtime/dry-run/dryRunContext.ts"],
  ["testRun/dryRunFileBlocks.ts", "runtime/dry-run/dryRunFileBlocks.ts"],
  ["testRun/dryRunLogs.ts", "runtime/dry-run/dryRunLogs.ts"],
  ["testRun/dryRunOutputUtils.ts", "runtime/dry-run/dryRunOutputUtils.ts"],
  ["testRun/dryRunPythonBlock.ts", "runtime/dry-run/dryRunPythonBlock.ts"],

  ["execution/appendCustomToolText.ts", "runtime/execution/appendCustomToolText.ts"],
  ["execution/runCustomToolExecution.ts", "runtime/execution/runCustomToolExecution.ts"],
  ["execution/runCustomToolPython.ts", "runtime/execution/runCustomToolPython.ts"],

  ["testRun/scanCustomToolFiles.ts", "runtime/files/scanCustomToolFiles.ts"],

  ["testRun/appendTextPreview.ts", "runtime/templates/appendTextPreview.ts"],
  ["testRun/templateRenderer.ts", "runtime/templates/templateRenderer.ts"],

  ["testRun/createInitialTestValues.ts", "runtime/model/createInitialTestValues.ts"],
  ["testRun/testRunTypes.ts", "runtime/model/testRunTypes.ts"],
];

const barrelFiles = new Map([
  [
    "runtime/components/index.ts",
    [
      "export * from \"./CustomToolTestPanel\";",
      "export * from \"./TestRunAppendPreviews\";",
      "export * from \"./TestRunBlockOutputs\";",
      "export * from \"./TestRunExecutionPlan\";",
      "export * from \"./TestRunInputField\";",
      "export * from \"./TestRunLogs\";",
      "",
    ].join("\n"),
  ],
  [
    "runtime/dry-run/index.ts",
    [
      "export * from \"./dryRunBasicBlocks\";",
      "export * from \"./dryRunContext\";",
      "export * from \"./dryRunFileBlocks\";",
      "export * from \"./dryRunLogs\";",
      "export * from \"./dryRunOutputUtils\";",
      "export * from \"./dryRunPythonBlock\";",
      "export * from \"./runCustomToolDryRun\";",
      "",
    ].join("\n"),
  ],
  [
    "runtime/execution/index.ts",
    [
      "export * from \"./appendCustomToolText\";",
      "export * from \"./runCustomToolExecution\";",
      "export * from \"./runCustomToolPython\";",
      "",
    ].join("\n"),
  ],
  [
    "runtime/files/index.ts",
    ["export * from \"./scanCustomToolFiles\";", ""].join("\n"),
  ],
  [
    "runtime/templates/index.ts",
    ["export * from \"./appendTextPreview\";", "export * from \"./templateRenderer\";", ""].join("\n"),
  ],
  [
    "runtime/model/index.ts",
    ["export * from \"./createInitialTestValues\";", "export * from \"./testRunTypes\";", ""].join("\n"),
  ],
]);

function assertRepoRoot() {
  const packageJsonPath = path.join(repoRoot, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Run this script from the repository root. Missing: ${packageJsonPath}`);
  }

  if (!fs.existsSync(customToolsRoot)) {
    throw new Error(`Missing custom-tools source folder: ${customToolsRoot}`);
  }
}

function normalizePath(filePath) {
  return path.normalize(filePath);
}

function toPosixPath(filePath) {
  return filePath.replaceAll(path.sep, "/");
}

function ensureDirForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeUtf8(filePath, content) {
  ensureDirForFile(filePath);
  fs.writeFileSync(filePath, content, "utf8");
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

  result = result.replace(
    /(\b(?:import|export)\b[\s\S]*?\bfrom\s*["'])([^"']+)(["'])/g,
    (match, before, specifier, quote) => `${before}${replacer(specifier) ?? specifier}${quote}`,
  );

  result = result.replace(
    /(\bimport\s*["'])([^"']+)(["'])/g,
    (match, before, specifier, quote) => `${before}${replacer(specifier) ?? specifier}${quote}`,
  );

  result = result.replace(
    /(\bimport\s*\(\s*["'])([^"']+)(["']\s*\))/g,
    (match, before, specifier, after) => `${before}${replacer(specifier) ?? specifier}${after}`,
  );

  return result;
}

function hasDefaultExport(text) {
  return /\bexport\s+default\b/.test(text) || /\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}/s.test(text);
}

function makeShimContent(sourceFile, targetFile, includeDefaultExport) {
  const targetSpecifier = toImportSpecifier(sourceFile, targetFile);
  const lines = [
    `export * from "${targetSpecifier}";`,
  ];

  if (includeDefaultExport) {
    lines.push(`export { default } from "${targetSpecifier}";`);
  }

  lines.push("");
  return lines.join("\n");
}

function relativeRepoPath(filePath) {
  return toPosixPath(path.relative(repoRoot, filePath));
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

function rewriteAndMoveSources(moveMap) {
  const discoveredFiles = walkSourceFiles(srcRoot);
  const knownFiles = createKnownFileSet([
    ...discoveredFiles,
    ...moveMap.values(),
  ]);

  const changedFiles = [];
  const movedFiles = [];
  const skippedMovedSources = new Set();
  const defaultExportBySource = new Map();

  for (const [sourceFile, targetFile] of moveMap) {
    if (fs.existsSync(sourceFile)) {
      defaultExportBySource.set(sourceFile, hasDefaultExport(readUtf8(sourceFile)));
    } else if (fs.existsSync(targetFile)) {
      defaultExportBySource.set(sourceFile, hasDefaultExport(readUtf8(targetFile)));
    } else {
      defaultExportBySource.set(sourceFile, false);
    }
  }

  for (const filePath of discoveredFiles) {
    const movedTarget = moveMap.get(filePath);

    if (movedTarget && fs.existsSync(movedTarget)) {
      skippedMovedSources.add(filePath);
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
      fs.unlinkSync(filePath);
      movedFiles.push([filePath, outputFile]);
    } else if (rewrittenText !== originalText) {
      writeUtf8(outputFile, rewrittenText);
      changedFiles.push(outputFile);
    }
  }

  return {
    changedFiles,
    movedFiles,
    skippedMovedSources,
    defaultExportBySource,
  };
}

function writeCompatibilityShims(moveMap, defaultExportBySource) {
  const shimFiles = [];

  for (const [sourceFile, targetFile] of moveMap) {
    if (!fs.existsSync(targetFile)) {
      console.warn(`Skipping shim because target is missing: ${relativeRepoPath(targetFile)}`);
      continue;
    }

    const shimContent = makeShimContent(sourceFile, targetFile, defaultExportBySource.get(sourceFile) ?? false);
    const previousContent = fs.existsSync(sourceFile) ? readUtf8(sourceFile) : null;

    if (previousContent !== shimContent) {
      writeUtf8(sourceFile, shimContent);
      shimFiles.push(sourceFile);
    }
  }

  return shimFiles;
}

function writeBarrelFiles() {
  const written = [];

  for (const [relativePath, content] of barrelFiles) {
    const filePath = path.join(customToolsRoot, relativePath);
    const previousContent = fs.existsSync(filePath) ? readUtf8(filePath) : null;

    if (previousContent !== content) {
      writeUtf8(filePath, content);
      written.push(filePath);
    }
  }

  return written;
}

function report(title, paths) {
  if (paths.length === 0) {
    return;
  }

  console.log(`\n${title}`);
  for (const item of paths) {
    if (Array.isArray(item)) {
      console.log(`  - ${relativeRepoPath(item[0])} -> ${relativeRepoPath(item[1])}`);
    } else {
      console.log(`  - ${relativeRepoPath(item)}`);
    }
  }
}

function main() {
  assertRepoRoot();

  const moveMap = buildMoveMap();
  const {
    changedFiles,
    movedFiles,
    skippedMovedSources,
    defaultExportBySource,
  } = rewriteAndMoveSources(moveMap);

  const shimFiles = writeCompatibilityShims(moveMap, defaultExportBySource);
  const barrelFilePaths = writeBarrelFiles();

  report("Moved runtime files:", movedFiles);
  report("Updated imports in existing files:", changedFiles);
  report("Wrote compatibility shims:", shimFiles);
  report("Wrote runtime barrel files:", barrelFilePaths);

  if (skippedMovedSources.size > 0) {
    report("Skipped old source files because runtime targets already existed:", [...skippedMovedSources]);
  }

  if (movedFiles.length === 0 && changedFiles.length === 0 && shimFiles.length === 0 && barrelFilePaths.length === 0) {
    console.log("Runtime cleanup patch was already applied. No files changed.");
  }

  console.log("\nNext commands:");
  console.log("  npm run build");
  console.log("\nAfter the build passes, keep the testRun/ and execution/ shims for one checkpoint commit.");
  console.log("A later cleanup patch can delete those shim folders once no imports reference them.");
}

main();
