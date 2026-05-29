import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  isFoundationCustomToolBlockType,
  type CustomToolBlockType,
} from "../../../domain/customToolTypes";
import { FoundationBackendContractPanel } from "./foundation-backend";
import { FoundationBlockConfigEditor } from "./foundation-config";
import { PythonBlockConfigEditor } from "./PythonBlockConfigEditor";

type BlockConfigEditorProps = {
  blockId: string;
  blockType: CustomToolBlockType;
  config: Record<string, unknown>;
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
  blockId,
  configText,
  error,
  onTextChange,
  onCommit,
}: {
  blockId: string;
  configText: string;
  error: string | null;
  onTextChange: (value: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${blockId}-config`}>Config JSON</Label>

      <Textarea
        id={`${blockId}-config`}
        value={configText}
        onChange={(event) => onTextChange(event.target.value)}
        onBlur={onCommit}
        className="min-h-40 font-mono text-xs"
      />

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Edit the JSON, then click outside the field to save it.
        </p>
      )}
    </div>
  );
}

export function BlockConfigEditor({
  blockId,
  blockType,
  config,
  onConfigChange,
}: BlockConfigEditorProps) {
  const [configText, setConfigText] = useState(() => formatConfig(config));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfigText(formatConfig(config));
    setError(null);
  }, [blockId, config]);

  const commitConfig = () => {
    try {
      onConfigChange(parseConfig(configText));
      setError(null);
    } catch (parseError) {
      setError(
        parseError instanceof Error ? parseError.message : "Invalid JSON.",
      );
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
          onConfigChange={onConfigChange}
        />

        <FoundationBackendContractPanel
          blockId={blockId}
          blockType={blockType}
          config={config}
        />

        <details className="rounded-2xl border bg-card/70 p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Advanced raw config
          </summary>
          <div className="mt-4">
            <RawConfigEditor
              blockId={blockId}
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
      blockId={blockId}
      configText={configText}
      error={error}
      onTextChange={setConfigText}
      onCommit={commitConfig}
    />
  );
}
