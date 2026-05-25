import { Button } from "@/components/ui/button";
import type { CustomToolManifest } from "@/features/custom-tools/model/customToolTypes";

type PublishedToolManagementRowProps = {
  tool: CustomToolManifest;
  isDeleting: boolean;
  onEdit: (tool: CustomToolManifest) => void;
  onDelete: (tool: CustomToolManifest) => void;
};

export function PublishedToolManagementRow({
  tool,
  isDeleting,
  onEdit,
  onDelete,
}: PublishedToolManagementRowProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <div className="font-medium">{tool.name}</div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {tool.description || "No description provided."}
        </p>
        <div className="text-xs text-muted-foreground">
          {tool.inputs.length} inputs · {tool.status}
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="outline" onClick={() => onEdit(tool)}>
          Edit draft
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isDeleting}
          onClick={() => onDelete(tool)}
        >
          {isDeleting ? "Unpublishing..." : "Unpublish"}
        </Button>
      </div>
    </div>
  );
}