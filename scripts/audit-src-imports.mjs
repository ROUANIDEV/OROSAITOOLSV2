import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");

const sourceExtensions = [".ts", ".tsx", ".js", ".jsx"];
const importableExtensions = [...sourceExtensions, ".json", ".css"];

const ignoredDirectories = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  ".vite",
  "target",
]);

const sideEffectImportPattern = /import\s+["']([^"']+)["'];?/g;
const fromImportPattern = /import\s+(?:type\s+)?[\s\S]*?\s+from\s+["']([^"']+)["'];?/g;
const dynamicImportPattern = /import\(\s*["']([^"']+)["']\s*\)/g;
const exportFromPattern = /export\s+(?:type\s+)?[\s\S]*?\s+from\s+["']([^"']+)["'];?/g;

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function isSourceFile(filePath) {
  return sourceExtensions.includes(path.extname(filePath));
}

function shouldSkipDirectory(directoryName) {
  return ignoredDirectories.has(directoryName);
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(entry.name)) {
        files.push(...walkFiles(path.join(directory, entry.name)));
      }

      continue;
    }

    if (entry.isFile()) {
      files.push(path.join(directory, entry.name));
    }
  }

  return files;
}

function withoutExtension(filePath) {
  const extension = path.extname(filePath);
  return extension ? filePath.slice(0, -extension.length) : filePath;
}

function resolveImportPath(importPath, fromFile) {
  if (importPath.startsWith("@/")) {
    return resolveFileOrDirectory(path.join(srcRoot, importPath.slice(2)));
  }

  if (importPath.startsWith("./") || importPath.startsWith("../")) {
    return resolveFileOrDirectory(path.resolve(path.dirname(fromFile), importPath));
  }

  return {
    type: "package",
    resolvedPath: importPath,
  };
}

function resolveFileOrDirectory(candidatePath) {
  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
    return {
      type: "file",
      resolvedPath: candidatePath,
    };
  }

  for (const extension of importableExtensions) {
    const filePath = `${candidatePath}${extension}`;

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return {
        type: "file",
        resolvedPath: filePath,
      };
    }
  }

  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
    for (const extension of importableExtensions) {
      const indexPath = path.join(candidatePath, `index${extension}`);

      if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
        return {
          type: "file",
          resolvedPath: indexPath,
        };
      }
    }
  }

  return {
    type: "missing",
    resolvedPath: candidatePath,
  };
}

function extractImports(fileContent) {
  const imports = new Set();

  for (const pattern of [
    sideEffectImportPattern,
    fromImportPattern,
    dynamicImportPattern,
    exportFromPattern,
  ]) {
    pattern.lastIndex = 0;

    let match = pattern.exec(fileContent);
    while (match) {
      imports.add(match[1]);
      match = pattern.exec(fileContent);
    }
  }

  return [...imports];
}

function isEntryLikeFile(filePath) {
  const relativePath = normalizePath(path.relative(srcRoot, filePath));

  return [
    "main.tsx",
    "main.ts",
    "App.tsx",
    "App.ts",
    "vite-env.d.ts",
  ].includes(relativePath);
}

function main() {
  if (!fs.existsSync(srcRoot)) {
    console.error("src folder was not found.");
    process.exit(1);
  }

  const allFiles = walkFiles(srcRoot);
  const sourceFiles = allFiles.filter(isSourceFile);
  const sourceFileSet = new Set(sourceFiles.map((filePath) => path.resolve(filePath)));

  const importedSourceFiles = new Set();
  const missingImports = [];

  for (const filePath of sourceFiles) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const imports = extractImports(fileContent);

    for (const importPath of imports) {
      const result = resolveImportPath(importPath, filePath);

      if (result.type === "missing") {
        missingImports.push({
          from: normalizePath(path.relative(projectRoot, filePath)),
          importPath,
          expected: normalizePath(path.relative(projectRoot, result.resolvedPath)),
        });

        continue;
      }

      if (result.type === "file") {
        const resolvedPath = path.resolve(result.resolvedPath);

        if (sourceFileSet.has(resolvedPath)) {
          importedSourceFiles.add(resolvedPath);
        }
      }
    }
  }

  const unusedCandidates = sourceFiles
    .filter((filePath) => !isEntryLikeFile(filePath))
    .filter((filePath) => !importedSourceFiles.has(path.resolve(filePath)))
    .map((filePath) => normalizePath(path.relative(projectRoot, filePath)))
    .sort();

  if (missingImports.length > 0) {
    console.error("\nBroken src imports found:\n");

    for (const item of missingImports) {
      console.error(`- ${item.from}`);
      console.error(`  imports: ${item.importPath}`);
      console.error(`  expected: ${item.expected}`);
    }

    console.error("\nFix broken imports before deleting or refactoring more files.\n");
    process.exit(1);
  }

  console.log("\nNo broken src imports found.");

  if (unusedCandidates.length === 0) {
    console.log("No unused source-file candidates found by import graph.\n");
    return;
  }

  console.log("\nPossible unused source-file candidates:");
  console.log("Review manually before deleting. Some files can be route-loaded, config-loaded, or intentionally exported.\n");

  for (const filePath of unusedCandidates) {
    console.log(`- ${filePath}`);
  }

  console.log("");
}

main();