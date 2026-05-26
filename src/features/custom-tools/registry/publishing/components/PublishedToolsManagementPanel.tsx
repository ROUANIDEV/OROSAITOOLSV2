import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CustomToolManifest } from "@/features/custom-tools/domain/customToolTypes";
import { createDraftFromPublishedTool } from "../model/createDraftFromPublishedTool";
import { PublishedToolManagementRow } from "./PublishedToolManagementRow";
import { notifyCustomToolsRegistryChanged } from "../registry";
import { deletePublishedCustomTool, loadPublishedCustomTools } from "../../storage/_legacy-persistence-leftovers";

const REGISTRY_CHANGED_EVENT = "custom-tools-registry-changed";

type PublishedToolsManagementPanelProps = {
  refreshSignal?: number;
  onEditTool: (tool: CustomToolManifest) => void;
};

export function PublishedToolsManagementPanel({
  refreshSignal = 0,
  onEditTool,
}: PublishedToolsManagementPanelProps) {
  const [tools, setTools] = useState<CustomToolManifest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingToolId, setDeletingToolId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshTools = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    setError("");

    try {
      setTools(await loadPublishedCustomTools());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load published tools.",
      );
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshTools();
  }, [refreshTools, refreshSignal]);

  useEffect(() => {
    const handleRegistryChanged = () => {
      void refreshTools(false);
    };

    window.addEventListener(REGISTRY_CHANGED_EVENT, handleRegistryChanged);

    return () => {
      window.removeEventListener(REGISTRY_CHANGED_EVENT, handleRegistryChanged);
    };
  }, [refreshTools]);

  const editTool = (tool: CustomToolManifest) => {
    onEditTool(createDraftFromPublishedTool(tool));
    setMessage(`Loaded "${tool.name}" into the current draft.`);
    setError("");
  };

  const deleteTool = async (tool: CustomToolManifest) => {
    const confirmed = window.confirm(
      `Unpublish "${tool.name}"? The editable draft will not be deleted.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingToolId(tool.id);
    setMessage("");
    setError("");

    try {
      const nextTools = await deletePublishedCustomTool(tool.id);

      setTools(nextTools);
      notifyCustomToolsRegistryChanged();
      setMessage(`Unpublished "${tool.name}".`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to unpublish this tool.",
      );
    } finally {
      setDeletingToolId("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Published tools</CardTitle>
            <CardDescription>
              Manage tools that already appear in the sidebar.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshTools()}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-lg border bg-muted p-3 text-sm">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading published tools...
          </p>
        ) : null}

        {!isLoading && tools.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No published tools yet. Test and publish a draft first.
          </div>
        ) : null}

        {tools.map((tool) => (
          <PublishedToolManagementRow
            key={tool.id}
            tool={tool}
            isDeleting={deletingToolId === tool.id}
            onEdit={editTool}
            onDelete={deleteTool}
          />
        ))}
      </CardContent>
    </Card>
  );
}