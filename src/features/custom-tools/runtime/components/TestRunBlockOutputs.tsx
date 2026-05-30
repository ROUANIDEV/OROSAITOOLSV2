import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { CustomToolBlock } from "../../domain/customToolTypes";

type TestRunBlockOutputsProps = {
  outputs: Record<string, unknown>;
  blocks?: CustomToolBlock[];
};

function stringifyOutput(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getOutputKind(value: unknown) {
  if (typeof value === "string") return "text";
  if (typeof value === "number" || typeof value === "boolean") return typeof value;
  if (value === null || typeof value === "undefined") return "empty";
  if (Array.isArray(value)) return "array";
  return "json";
}

function outputIdFromBlock(block: CustomToolBlock) {
  const raw = block.config?.outputId;
  return typeof raw === "string" && raw.trim() ? raw.trim() : block.id;
}

function outputLabelFromBlock(block: CustomToolBlock) {
  return block.label || outputIdFromBlock(block);
}

export function TestRunBlockOutputs({
  outputs,
  blocks = [],
}: TestRunBlockOutputsProps) {
  const outputBlocks = useMemo(
    () => blocks.filter((block) => block.type === "io.output"),
    [blocks],
  );

  if (outputBlocks.length > 0) {
    return (
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold">Workflow outputs</h4>
          <p className="text-sm text-muted-foreground">
            These are the user-facing output fields from your Output blocks.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {outputBlocks.map((block) => {
            const outputId = outputIdFromBlock(block);
            const value = outputs[outputId];
            const hasValue = Object.prototype.hasOwnProperty.call(outputs, outputId);
            return (
              <div key={block.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{outputLabelFromBlock(block)}</p>
                    <p className="text-xs text-muted-foreground">{outputId}</p>
                  </div>
                  <Badge variant="secondary">
                    {hasValue ? getOutputKind(value) : "waiting"}
                  </Badge>
                </div>
                <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-muted p-3 text-sm">
                  {hasValue ? stringifyOutput(value) : "Run Rust Workflow to see this result."}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const entries = Object.entries(outputs).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Run results</h4>
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{key}</p>
              <Badge variant="secondary">{getOutputKind(value)}</Badge>
            </div>
            <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-muted p-3 text-sm">
              {stringifyOutput(value)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
