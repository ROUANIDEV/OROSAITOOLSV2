import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { CustomToolBlock } from "../../domain/customToolTypes";

type TestRunBlockOutputsProps = {
  outputs: Record<string, unknown>;
  blocks?: CustomToolBlock[];
};

type ReferenceOption = { label: string; value: string };

function stringifyOutput(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getOutputKind(value: unknown) {
  if (typeof value === "string") return "text";
  if (typeof value === "number" || typeof value === "boolean") return typeof value;
  if (value === null) return "empty";
  if (Array.isArray(value)) return "array";
  return "json";
}

function createReferenceOptions(blockId: string, value: unknown): ReferenceOption[] {
  const options = [{ label: "Copy block ref", value: `{{outputs.${blockId}}}` }];

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const firstKey = Object.keys(value)[0];
    if (firstKey) {
      options.push({
        label: `Copy ${firstKey} ref`,
        value: `{{outputs.${blockId}.${firstKey}}}`,
      });
    }
  }

  return options;
}

export function TestRunBlockOutputs({
  outputs,
  blocks = [],
}: TestRunBlockOutputsProps) {
  const [copiedReference, setCopiedReference] = useState("");
  const blockLabelById = useMemo(() => {
    return new Map(blocks.map((block) => [block.id, block.label]));
  }, [blocks]);

  const entries = Object.entries(outputs).filter(([, value]) => {
    return value !== undefined;
  });

  const copyReference = (reference: string) => {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(reference).then(() => {
      setCopiedReference(reference);
    });
  };

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">Block outputs</h4>
        <p className="text-sm text-muted-foreground">
          Use these values in later templates with outputs references.
        </p>
      </div>

      {entries.map(([blockId, value]) => {
        const label = blockLabelById.get(blockId) ?? "Unknown block";
        const referenceOptions = createReferenceOptions(blockId, value);
        const previewReference =
          referenceOptions[referenceOptions.length - 1].value;

        return (
          <div key={blockId} className="space-y-3 rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {blockId}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                {getOutputKind(value)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {referenceOptions.map((referenceOption) => (
                <Button
                  key={referenceOption.value}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyReference(referenceOption.value)}
                >
                  {copiedReference === referenceOption.value
                    ? "Copied"
                    : referenceOption.label}
                </Button>
              ))}
            </div>

            <p className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
              {previewReference}
            </p>

            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
              {stringifyOutput(value)}
            </pre>
          </div>
        );
      })}
    </div>
  );
}