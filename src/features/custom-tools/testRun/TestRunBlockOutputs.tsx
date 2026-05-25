type TestRunBlockOutputsProps = {
  outputs: Record<string, unknown>;
};

function stringifyOutput(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getOutputKind(value: unknown) {
  if (typeof value === "string") {
    return "text";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return typeof value;
  }

  if (value === null) {
    return "empty";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  return "json";
}

function createReferenceExample(blockId: string, value: unknown) {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const firstKey = Object.keys(value)[0];

    if (firstKey) {
      return `{{outputs.${blockId}.${firstKey}}}`;
    }
  }

  return `{{outputs.${blockId}}}`;
}

export function TestRunBlockOutputs({ outputs }: TestRunBlockOutputsProps) {
  const entries = Object.entries(outputs).filter(([, value]) => {
    return value !== undefined;
  });

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">Block outputs</h4>
        <p className="text-sm text-muted-foreground">
          Use these values in later templates with outputs references.
        </p>
      </div>

      {entries.map(([blockId, value]) => (
        <div key={blockId} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="break-all text-sm font-medium">{blockId}</p>
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              {getOutputKind(value)}
            </span>
          </div>

          <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
            {createReferenceExample(blockId, value)}
          </p>

          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
            {stringifyOutput(value)}
          </pre>
        </div>
      ))}
    </div>
  );
}