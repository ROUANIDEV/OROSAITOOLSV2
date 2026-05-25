import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type WorkflowDeleteSelectedBlocksDialogProps = {
  open: boolean;
  selectedBlockNames: string[];
  onCancel: () => void;
  onConfirm: () => void;
};

export function WorkflowDeleteSelectedBlocksDialog({
  open,
  selectedBlockNames,
  onCancel,
  onConfirm,
}: WorkflowDeleteSelectedBlocksDialogProps) {
  if (!open) return null;

  const selectedCount = selectedBlockNames.length;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border bg-background p-5 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-2xl bg-destructive/10 p-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-semibold">
              Delete selected blocks?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              This will delete {selectedCount} selected block
              {selectedCount === 1 ? "" : "s"} and only the connection lines
              attached to those blocks.
            </p>
          </div>
        </div>

        <div className="mb-4 max-h-52 overflow-y-auto rounded-2xl border bg-muted/35 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Blocks to delete
          </p>

          {selectedBlockNames.length > 0 ? (
            <ul className="space-y-1">
              {selectedBlockNames.map((name) => (
                <li
                  key={name}
                  className="rounded-lg bg-background px-3 py-2 text-sm shadow-sm"
                >
                  {name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No selected blocks.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={selectedCount === 0}
          >
            Delete selected
          </Button>
        </div>
      </div>
    </div>
  );
}
