import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PythonBlockConfigEditorProps = {
  blockId: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
};

function getPythonCode(config: Record<string, unknown>) {
  return typeof config.code === "string" ? config.code : "";
}

function getTimeoutMs(config: Record<string, unknown>) {
  const rawTimeout = config.timeoutMs;
  const parsedTimeout =
    typeof rawTimeout === "number" ? rawTimeout : Number(rawTimeout);

  if (!Number.isFinite(parsedTimeout)) return 5000;

  return Math.min(15000, Math.max(1000, Math.round(parsedTimeout)));
}

export function PythonBlockConfigEditor({
  blockId,
  config,
  onConfigChange,
}: PythonBlockConfigEditorProps) {
  const codeId = `${blockId}-python-code`;
  const timeoutId = `${blockId}-python-timeout`;
  const timeoutMs = getTimeoutMs(config);

  const updateConfig = (patch: Record<string, unknown>) => {
    onConfigChange({
      ...config,
      ...patch,
    });
  };

  const updateTimeout = (value: string) => {
    const parsedTimeout = Number(value);

    if (!Number.isFinite(parsedTimeout)) return;

    updateConfig({
      timeoutMs: Math.round(parsedTimeout),
    });
  };

  const normalizeTimeout = () => {
    updateConfig({
      timeoutMs,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={codeId}>Python code</Label>

        <Textarea
          id={codeId}
          value={getPythonCode(config)}
          onChange={(event) => updateConfig({ code: event.target.value })}
          placeholder="print JSON to stdout"
          spellCheck={false}
        />

        <p className="text-xs text-muted-foreground">
          The runner sends JSON on stdin. Print valid JSON to stdout so later
          blocks can use this block output.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={timeoutId}>Timeout in milliseconds</Label>

        <Input
          id={timeoutId}
          type="number"
          min={1000}
          max={15000}
          step={500}
          value={timeoutMs}
          onChange={(event) => updateTimeout(event.target.value)}
          onBlur={normalizeTimeout}
        />

        <p className="text-xs text-muted-foreground">
          Allowed range is 1,000 to 15,000 ms. The backend also clamps this
          value during execution.
        </p>
      </div>
    </div>
  );
}