import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { CustomToolBlockType } from "../../../domain/customToolTypes";

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

  return (
    <div className="space-y-2">
      <Label htmlFor={`${blockId}-config`}>Config JSON</Label>

      <Textarea
        id={`${blockId}-config`}
        className="min-h-40 font-mono text-xs"
        value={configText}
        onBlur={commitConfig}
        onChange={(event) => setConfigText(event.target.value)}
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