const fs = require("node:fs");
const path = require("node:path");

const sourceExtensions = [".ts", ".tsx"];
const sourceExtensionSet = new Set(sourceExtensions);

function normalizeContent(content) {
  return content.replace(/\r\n/g, "\n");
}

function normalizePath(filePath) {
  return path.normalize(filePath);
}

function toPosixPath(filePath) {
  return filePath.replaceAll(path.sep, "/");
}

function relativeRepoPath(repoRoot, filePath) {
  return toPosixPath(path.relative(repoRoot, filePath));
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
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") {
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

function appendExportIfMissing(indexFile, exportLine) {
  const normalizedExportLine = exportLine.trim();
  const previousContent = fs.existsSync(indexFile) ? readUtf8(indexFile) : "";
  if (previousContent.split("\n").some((line) => line.trim() === normalizedExportLine)) {
    return false;
  }
  const nextContent = `${previousContent.trimEnd()}\n${normalizedExportLine}\n`.trimStart();
  writeUtf8(indexFile, nextContent);
  return true;
}

function buildMoveMap(featureRoot, plannedMoves) {
  const moveMap = new Map();
  for (const [fromRelative, toRelative] of plannedMoves) {
    const sourceFile = normalizePath(path.join(featureRoot, fromRelative));
    const targetFile = normalizePath(path.join(featureRoot, toRelative));
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

function prepareMoveConflicts(repoRoot, featureName, moveMap) {
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
    conflicts.push({ sourceFile, targetFile });
  }
  if (conflicts.length === 0) {
    return;
  }
  const details = conflicts
    .map(
      ({ sourceFile, targetFile }) =>
        ` - ${relativeRepoPath(repoRoot, sourceFile)} and ${relativeRepoPath(repoRoot, targetFile)} both exist with different content`,
    )
    .join("\n");
  throw new Error(
    `Refusing to overwrite local edits while cleaning ${featureName}.\n` +
      details +
      "\nResolve those duplicate files manually, then rerun this script.",
  );
}

function rewriteAndMoveSources({ repoRoot, srcRoot, featureName, moveMap }) {
  prepareMoveConflicts(repoRoot, featureName, moveMap);

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

  return { changedFiles, movedFiles, removedDuplicateOldSources };
}

function writeBarrelFiles(featureRoot, exactBarrelFiles) {
  const written = [];
  for (const [relativePath, content] of exactBarrelFiles) {
    const filePath = path.join(featureRoot, relativePath);
    if (writeUtf8IfChanged(filePath, content)) {
      written.push(filePath);
    }
  }
  return written;
}

function appendBarrelExports(featureRoot, appendOnlyBarrelExports = new Map()) {
  const written = [];
  for (const [relativePath, exportLines] of appendOnlyBarrelExports) {
    const filePath = path.join(featureRoot, relativePath);
    let changed = false;
    for (const exportLine of exportLines) {
      if (appendExportIfMissing(filePath, exportLine)) {
        changed = true;
      }
    }
    if (changed) {
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

function cleanupOldDirectories(featureRoot, moveMap, extraOldDirectories = []) {
  const removed = [];
  for (const oldDirRelative of extraOldDirectories) {
    const oldDir = path.join(featureRoot, oldDirRelative);
    if (fs.existsSync(oldDir) && fs.statSync(oldDir).isDirectory() && fs.readdirSync(oldDir).length === 0) {
      fs.rmdirSync(oldDir);
      removed.push(oldDir);
    }
  }
  for (const [sourceFile] of moveMap) {
    removed.push(...removeEmptyDirectoryTree(path.dirname(sourceFile), featureRoot));
  }
  return [...new Set(removed.map(normalizePath))];
}

function findRemainingOldFiles(moveMap) {
  const remaining = [];
  for (const [sourceFile] of moveMap) {
    if (fs.existsSync(sourceFile)) {
      remaining.push(sourceFile);
    }
  }
  return [...new Set(remaining.map(normalizePath))];
}

function report(repoRoot, title, values) {
  if (values.length === 0) {
    return;
  }
  console.log(`\n${title}`);
  for (const value of values) {
    if (Array.isArray(value)) {
      console.log(` - ${relativeRepoPath(repoRoot, value[0])} -> ${relativeRepoPath(repoRoot, value[1])}`);
    } else {
      console.log(` - ${relativeRepoPath(repoRoot, value)}`);
    }
  }
}

function assertRepoRoot({ repoRoot, srcRoot, featureRoot, featureName }) {
  const packageJsonPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Run this script from the repository root.\nMissing: ${packageJsonPath}`);
  }
  if (!fs.existsSync(srcRoot)) {
    throw new Error(`Missing src directory: ${srcRoot}`);
  }
  if (!fs.existsSync(featureRoot)) {
    throw new Error(`Missing ${featureName} feature directory: ${featureRoot}`);
  }
}

function runFeatureArchitectureCleanup(config) {
  const repoRoot = process.cwd();
  const srcRoot = path.join(repoRoot, "src");
  const featureRoot = path.join(srcRoot, "features", config.featureName);

  assertRepoRoot({ repoRoot, srcRoot, featureRoot, featureName: config.featureName });

  const moveMap = buildMoveMap(featureRoot, config.plannedMoves);
  const { changedFiles, movedFiles, removedDuplicateOldSources } = rewriteAndMoveSources({
    repoRoot,
    srcRoot,
    featureName: config.featureName,
    moveMap,
  });
  const barrelFiles = [
    ...writeBarrelFiles(featureRoot, config.exactBarrelFiles ?? new Map()),
    ...appendBarrelExports(featureRoot, config.appendOnlyBarrelExports ?? new Map()),
  ];
  const removedDirectories = cleanupOldDirectories(
    featureRoot,
    moveMap,
    config.extraOldDirectories ?? [],
  );
  const remainingOldFiles = findRemainingOldFiles(moveMap);

  report(repoRoot, "Moved files:", movedFiles);
  report(repoRoot, "Updated imports in existing files:", changedFiles);
  report(repoRoot, "Removed duplicate old source files:", removedDuplicateOldSources);
  report(repoRoot, "Wrote barrel files:", barrelFiles);
  report(repoRoot, "Removed empty old directories:", removedDirectories);

  if (remainingOldFiles.length > 0) {
    console.warn(`\nOld ${config.featureName} files still exist and were not deleted:`);
    for (const item of remainingOldFiles) {
      console.warn(` - ${relativeRepoPath(repoRoot, item)}`);
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
    console.log(`${config.phaseLabel} was already applied. No files changed.`);
  }

  console.log("\nNext commands:");
  console.log(" npm run build");
  if (config.expectedResult?.length) {
    console.log("\nExpected clean shape:");
    for (const item of config.expectedResult) {
      console.log(` - ${item}`);
    }
  }
}

module.exports = {
  runFeatureArchitectureCleanup,
};
