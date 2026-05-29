#!/usr/bin/env bash
set -euo pipefail

repo_root="$(pwd)"
echo "Applying Step 12 clean compile warnings patch from: $repo_root"

domain_mod="$repo_root/src-tauri/src/domain/mod.rs"
if [[ -f "$domain_mod" ]]; then
  python - "$domain_mod" <<'PY'
from pathlib import Path
import re, sys
path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
next_text = re.sub(r"(?m)^\s*pub\s+mod\s+foundation_engine\s*;\s*\n?", "", text)
next_text = re.sub(r"(?m)^\s*mod\s+foundation_engine\s*;\s*\n?", "", next_text)
if next_text != text:
    path.write_text(next_text, encoding="utf-8")
    print("Removed legacy foundation_engine module declaration from src-tauri/src/domain/mod.rs")
else:
    print("No legacy foundation_engine module declaration found in src-tauri/src/domain/mod.rs")
PY
else
  echo "Skipped: src-tauri/src/domain/mod.rs not found"
fi

handlers="$repo_root/src-tauri/src/services/foundation_engine/handlers.rs"
if [[ -f "$handlers" ]]; then
  python - "$handlers" <<'PY'
from pathlib import Path
import re, sys
path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
next_text = text
next_text = re.sub(r"array_of_strings,\s*bool_value,\s*", "array_of_strings, ", next_text)
next_text = re.sub(r",\s*bool_value", "", next_text)
next_text = re.sub(r"bool_value,\s*", "", next_text)
if next_text != text:
    path.write_text(next_text, encoding="utf-8")
    print("Removed stale bool_value import from handlers.rs")
else:
    print("No stale bool_value import found in handlers.rs")
PY
else
  echo "Skipped: handlers.rs not found"
fi

values="$repo_root/src-tauri/src/services/foundation_engine/values.rs"
if [[ -f "$values" ]]; then
  python - "$values" <<'PY'
from pathlib import Path
import re, sys
path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
pattern = r"\n?pub\s+fn\s+bool_value\s*\([^)]*\)\s*->\s*bool\s*\{\s*config\.get\(key\)\s*\.and_then\(Value::as_bool\)\s*\.unwrap_or\(fallback\)\s*\}\s*"
next_text = re.sub(pattern, "\n", text, flags=re.S)
if next_text != text:
    path.write_text(next_text, encoding="utf-8")
    print("Removed unused bool_value helper from values.rs")
elif re.search(r"(?m)^pub\s+fn\s+bool_value", text):
    if not re.search(r"(?m)^#\[allow\(dead_code\)\]\s*\npub\s+fn\s+bool_value", text):
        next_text = re.sub(r"(?m)^pub\s+fn\s+bool_value", "#[allow(dead_code)]\npub fn bool_value", text)
        path.write_text(next_text, encoding="utf-8")
        print("Marked bool_value as allowed dead code because automatic removal did not match its body")
    else:
        print("bool_value already has allow(dead_code)")
else:
    print("No bool_value helper found in values.rs")
PY
else
  echo "Skipped: values.rs not found"
fi

service_mod="$repo_root/src-tauri/src/services/foundation_engine/mod.rs"
if [[ -f "$service_mod" ]]; then
  python - "$service_mod" <<'PY'
from pathlib import Path
import re, sys
path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
next_text = re.sub(r"(?m)^use\s+runner::\{([^}]+)\};", r"pub use runner::{\1};", text)
next_text = re.sub(r"(?m)^use\s+types::\{([^}]+)\};", r"pub use types::{\1};", next_text)
if next_text != text:
    path.write_text(next_text, encoding="utf-8")
    print("Converted private service imports to public re-exports in mod.rs")
else:
    print("No private service imports needed conversion in mod.rs")
PY
else
  echo "Skipped: foundation_engine/mod.rs not found"
fi

echo
echo "Patch applied. Now run:"
echo "  cd src-tauri"
echo "  cargo check"
