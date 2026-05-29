$ErrorActionPreference = "Stop"

function Read-TextFile($path) {
  return [System.IO.File]::ReadAllText($path)
}

function Write-TextFile($path, $text) {
  [System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))
}

$repoRoot = Get-Location

Write-Host "Applying Step 12 clean compile warnings patch from: $repoRoot"

# 1) Retire the legacy duplicate domain module.
# The active backend engine uses src-tauri/src/services/foundation_engine/types.rs.
# Keeping src-tauri/src/domain/foundation_engine.rs compiled creates dead_code warnings
# because that legacy contract is no longer used by the Tauri command/service path.
$domainModPath = Join-Path $repoRoot "src-tauri/src/domain/mod.rs"
if (Test-Path $domainModPath) {
  $text = Read-TextFile $domainModPath
  $next = $text -replace "(?m)^\s*pub\s+mod\s+foundation_engine\s*;\s*\r?\n?", ""
  $next = $next -replace "(?m)^\s*mod\s+foundation_engine\s*;\s*\r?\n?", ""

  if ($next -ne $text) {
    Write-TextFile $domainModPath $next
    Write-Host "Removed legacy foundation_engine module declaration from src-tauri/src/domain/mod.rs"
  } else {
    Write-Host "No legacy foundation_engine module declaration found in src-tauri/src/domain/mod.rs"
  }
} else {
  Write-Host "Skipped: src-tauri/src/domain/mod.rs not found"
}

# 2) Remove stale bool_value imports if they still exist.
$handlersPath = Join-Path $repoRoot "src-tauri/src/services/foundation_engine/handlers.rs"
if (Test-Path $handlersPath) {
  $text = Read-TextFile $handlersPath
  $next = $text
  $next = $next -replace "array_of_strings,\s*bool_value,\s*", "array_of_strings, "
  $next = $next -replace ",\s*bool_value", ""
  $next = $next -replace "bool_value,\s*", ""

  if ($next -ne $text) {
    Write-TextFile $handlersPath $next
    Write-Host "Removed stale bool_value import from handlers.rs"
  } else {
    Write-Host "No stale bool_value import found in handlers.rs"
  }
} else {
  Write-Host "Skipped: handlers.rs not found"
}

# 3) Remove the unused bool_value helper if present.
# The regex targets the simple helper function shape used in this engine.
$valuesPath = Join-Path $repoRoot "src-tauri/src/services/foundation_engine/values.rs"
if (Test-Path $valuesPath) {
  $text = Read-TextFile $valuesPath
  $pattern = "(?s)\r?\n?pub\s+fn\s+bool_value\s*\([^)]*\)\s*->\s*bool\s*\{\s*config\.get\(key\)\s*\.and_then\(Value::as_bool\)\s*\.unwrap_or\(fallback\)\s*\}\s*"
  $next = [regex]::Replace($text, $pattern, "`r`n")

  if ($next -ne $text) {
    Write-TextFile $valuesPath $next
    Write-Host "Removed unused bool_value helper from values.rs"
  } elseif ($text -match "(?m)^pub\s+fn\s+bool_value") {
    # Fallback: silence only this helper without affecting the rest of the engine.
    if ($text -notmatch "(?m)^#\[allow\(dead_code\)\]\s*\r?\npub\s+fn\s+bool_value") {
      $next = $text -replace "(?m)^pub\s+fn\s+bool_value", "#[allow(dead_code)]`r`npub fn bool_value"
      Write-TextFile $valuesPath $next
      Write-Host "Marked bool_value as allowed dead code because automatic removal did not match its body"
    } else {
      Write-Host "bool_value already has allow(dead_code)"
    }
  } else {
    Write-Host "No bool_value helper found in values.rs"
  }
} else {
  Write-Host "Skipped: values.rs not found"
}

# 4) If old private imports still exist in the foundation service module, convert them
# into public re-exports. Public re-exports are valid module API and do not produce
# unused-import warnings.
$serviceModPath = Join-Path $repoRoot "src-tauri/src/services/foundation_engine/mod.rs"
if (Test-Path $serviceModPath) {
  $text = Read-TextFile $serviceModPath
  $next = $text
  $next = $next -replace "(?m)^use\s+runner::\{([^}]+)\};", "pub use runner::{$1};"
  $next = $next -replace "(?m)^use\s+types::\{([^}]+)\};", "pub use types::{$1};"

  if ($next -ne $text) {
    Write-TextFile $serviceModPath $next
    Write-Host "Converted private service imports to public re-exports in mod.rs"
  } else {
    Write-Host "No private service imports needed conversion in mod.rs"
  }
} else {
  Write-Host "Skipped: foundation_engine/mod.rs not found"
}

Write-Host ""
Write-Host "Patch applied. Now run:"
Write-Host "  cd src-tauri"
Write-Host "  cargo check"
