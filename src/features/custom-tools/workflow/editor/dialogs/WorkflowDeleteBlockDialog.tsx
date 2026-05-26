import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { CustomToolBlock } from "../../../domain/customToolTypes";

type WorkflowDeleteBlockDialogProps = {
  block: CustomToolBlock | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function WorkflowDeleteBlockDialog({
  block,
  onCancel,
  onConfirm,
}: WorkflowDeleteBlockDialogProps) {
  if (!block) return null;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-background/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[2rem] border bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-semibold">Delete this block?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This removes “{block.label}” from the workflow. This action
                updates the current draft.
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onCancel}
            aria-label="Cancel delete"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete block
          </Button>
        </div>
      </div>
    </div>
  );
}