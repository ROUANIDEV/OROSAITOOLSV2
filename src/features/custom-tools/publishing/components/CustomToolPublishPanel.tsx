import { useState } from "react";
import { Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { PublishedToolsManagementPanel } from "./PublishedToolsManagementPanel";
import { markCustomToolDraftPublished } from "../../model/customToolDraftLifecycle";
import type { CustomToolManifest } from "../../model/customToolTypes";
import { notifyCustomToolsRegistryChanged } from "../registry/customToolsRegistryEvents";
import { upsertPublishedCustomTool } from "../../persistence/publishedCustomToolsStorage";
import { validateCustomToolDraft } from "../../validation/rules/customToolValidation";

type PublishStatus = "idle" | "publishing" | "published" | "error";

type CustomToolPublishPanelProps = {
  draft: CustomToolManifest;
  onDraftChange: (draft: CustomToolManifest) => void;
};

function getPublishBlockReason(draft: CustomToolManifest, hasErrors: boolean) {
  if (hasErrors) {
    return "Fix validation errors before publishing.";
  }

  if (draft.status === "draft") {
    return "Run a successful dry test before publishing.";
  }

  return null;
}

export function CustomToolPublishPanel({
  draft,
  onDraftChange,
}: CustomToolPublishPanelProps) {
  const [status, setStatus] = useState<PublishStatus>("idle");
  const [publishedToolsRefreshSignal, setPublishedToolsRefreshSignal] =
    useState(0);

  const validation = validateCustomToolDraft(draft);
  const blockReason = getPublishBlockReason(draft, !validation.canPublish);
  const canPublish = !blockReason && status !== "publishing";

  const publishTool = async () => {
    try {
      setStatus("publishing");

      const publishedDraft = markCustomToolDraftPublished(draft);
      await upsertPublishedCustomTool(publishedDraft);

      onDraftChange(publishedDraft);
      setPublishedToolsRefreshSignal((current) => current + 1);
      notifyCustomToolsRegistryChanged();
      setStatus("published");
    } catch (error) {
      console.error("Failed to publish custom tool.", error);
      setStatus("error");
    }
  };

  const editPublishedTool = (tool: CustomToolManifest) => {
    setStatus("idle");
    onDraftChange(tool);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Publish</CardTitle>
              <CardDescription>
                Save this tested tool into the local published tools registry.
              </CardDescription>
            </div>

            <Badge
              variant={draft.status === "published" ? "secondary" : "outline"}
            >
              {draft.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3">
          {blockReason ? (
            <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
              {blockReason}
            </p>
          ) : null}

          <Button disabled={!canPublish} onClick={publishTool}>
            <Rocket className="size-4" />
            {draft.status === "published"
              ? "Update published tool"
              : "Publish tool"}
          </Button>

          {status === "published" ? (
            <p className="text-sm text-muted-foreground">
              Tool published locally and added to the sidebar.
            </p>
          ) : null}

          {status === "error" ? (
            <p className="text-sm text-destructive">
              Failed to publish. Check the console for details.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <PublishedToolsManagementPanel
        refreshSignal={publishedToolsRefreshSignal}
        onEditTool={editPublishedTool}
      />
    </div>
  );
}