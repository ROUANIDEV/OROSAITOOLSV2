import { Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { DraftSaveStatus } from "./hooks/usePersistedCustomToolDraft";

type DraftActionsProps = {
  saveStatus: DraftSaveStatus;
  onDiscardDraft: () => void;
};

const statusLabel: Record<DraftSaveStatus, string> = {
  loading: "loading draft",
  idle: "no draft saved",
  saving: "saving",
  saved: "saved locally",
  error: "save failed",
};

export function DraftActions({
  saveStatus,
  onDiscardDraft,
}: DraftActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
      <div>
        <p className="text-sm font-medium">Current draft</p>
        <p className="text-sm text-muted-foreground">
          Drafts are autosaved in local app data.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={saveStatus === "error" ? "destructive" : "secondary"}>
          {statusLabel[saveStatus]}
        </Badge>

        <Button variant="outline" size="sm" onClick={onDiscardDraft}>
          <Trash2 className="size-4" />
          Discard draft
        </Button>
      </div>
    </div>
  );
}