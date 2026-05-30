import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  isFoundationCustomToolBlockType,
  type CustomToolBlock,
  type CustomToolBlockType,
} from "../../../domain/customToolTypes";
import type { FoundationArrowInputSuggestion } from "../../../runtime/foundationWorkflowRuntime";
import { FoundationBlockConfigEditor } from "./foundation-config";
import { getCanvasReferenceOptions } from "./foundation-config/FoundationConfigFields";
import { PythonBlockConfigEditor } from "./PythonBlockConfigEditor";

type BlockConfigEditorProps = {
  blockId: string;
  blockType: CustomToolBlockType;
  config: Record<string, unknown>;
  workflowBlocks?: CustomToolBlock[];
  linkedInputSuggestions?: FoundationArrowInputSuggestion[];
  onConfigChange: (config: Record<string, unknown>) => void;
};

function formatConfig(config: Record<string, unknown>) {
  return JSON.stringify(config, null, 2);
}

function parseConfig(value: string) {
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Config must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function RawConfigEditor({
  configText,
  error,
  onTextChange,
  onCommit,
}: {
  configText: string;
  error: string | null;
  onTextChange: (value: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Advanced config</Label>
      <Textarea
        value={configText}
        onChange={(event) => onTextChange(event.target.value)}
        onBlur={onCommit}
        className="min-h-40 font-mono text-xs"
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only edit this when you need the raw block data.
        </p>
      )}
    </div>
  );
}

export function BlockConfigEditor({
  blockId,
  blockType,
  config,
  workflowBlocks = [],
  linkedInputSuggestions = [],
  onConfigChange,
}: BlockConfigEditorProps) {
  const [configText, setConfigText] = useState(() => formatConfig(config));
  const [error, setError] = useState<string | null>(null);
  const referenceOptions = useMemo(
    () => getCanvasReferenceOptions(workflowBlocks),
    [workflowBlocks],
  );

  useEffect(() => {
    setConfigText(formatConfig(config));
    setError(null);
  }, [blockId, config]);

  const commitConfig = () => {
    try {
      onConfigChange(parseConfig(configText));
      setError(null);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Invalid JSON.");
    }
  };

  if (blockType === "python.code") {
    return (
      <PythonBlockConfigEditor
        blockId={blockId}
        config={config}
        onConfigChange={onConfigChange}
      />
    );
  }

  if (isFoundationCustomToolBlockType(blockType)) {
    return (
      <div className="space-y-4">
        <FoundationBlockConfigEditor
          blockId={blockId}
          blockType={blockType}
          config={config}
          referenceOptions={referenceOptions}
          linkedInputSuggestions={linkedInputSuggestions}
          onConfigChange={onConfigChange}
        />
        <details className="rounded-2xl border bg-card/70 p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Advanced raw config
          </summary>
          <div className="mt-4">
            <RawConfigEditor
              configText={configText}
              error={error}
              onTextChange={setConfigText}
              onCommit={commitConfig}
            />
          </div>
        </details>
      </div>
    );
  }

  return (
    <RawConfigEditor
      configText={configText}
      error={error}
      onTextChange={setConfigText}
      onCommit={commitConfig}
    />
  );
}
