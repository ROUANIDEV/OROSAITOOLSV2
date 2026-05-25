import { useEffect } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { CustomToolBlock } from "../model/customToolTypes";
import { CustomToolBlockRow } from "./CustomToolBlockRow";

type WorkflowBlockSettingsDialogProps = {
  block: CustomToolBlock | null;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onClose: () => void;
  onChange: (block: CustomToolBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export function WorkflowBlockSettingsDialog({
  block,
  index,
  canMoveUp,
  canMoveDown,
  onClose,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: WorkflowBlockSettingsDialogProps) {
  useEffect(() => {
    if (!block) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [block, onClose]);

  if (!block) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/55 p-3 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border bg-background shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Block settings</p>
            <p className="break-all text-xs text-muted-foreground">
              Double-click canvas blocks to open this editor.
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Close block settings"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[calc(92vh-4.5rem)] overflow-y-auto p-5">
          <CustomToolBlockRow
            block={block}
            index={index}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onChange={onChange}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onRemove={onRemove}
          />
        </div>
      </div>
    </div>
  );
}