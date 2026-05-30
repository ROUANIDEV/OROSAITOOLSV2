import type { CustomToolManifest } from "../../../../domain/customToolTypes";

type CustomToolInputsEditorProps = {
  draft: CustomToolManifest;
  onDraftChange: (draft: CustomToolManifest) => void;
};

export function CustomToolInputsEditor({ draft }: CustomToolInputsEditorProps) {
  const canvasInputCount = draft.workflow.blocks.filter((block) => block.type === "io.input").length;
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
      <h3 className="text-sm font-semibold">Inputs moved to Canvas</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        The old User fields editor is no longer the source of truth. Add IO → Input blocks on the canvas instead.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Canvas input blocks currently found: {canvasInputCount}
      </p>
    </div>
  );
}
