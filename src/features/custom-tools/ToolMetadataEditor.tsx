import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { CustomToolManifest } from "./model/customToolTypes";

type ToolMetadataEditorProps = {
  draft: CustomToolManifest;
  onDraftChange: (draft: CustomToolManifest) => void;
};

export function ToolMetadataEditor({
  draft,
  onDraftChange,
}: ToolMetadataEditorProps) {
  const updateMetadata = (
    field: "name" | "description",
    value: string,
  ) => {
    onDraftChange({
      ...draft,
      [field]: value,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool details</CardTitle>
        <CardDescription>
          Edit the basic identity of this custom tool. These values will later
          appear in the sidebar when the tool is published.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="custom-tool-name">Tool name</Label>
          <Input
            id="custom-tool-name"
            value={draft.name}
            placeholder="Example: History Document Updater"
            onChange={(event) => updateMetadata("name", event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="custom-tool-description">Description</Label>
          <Textarea
            id="custom-tool-description"
            value={draft.description}
            placeholder="Describe what this custom tool automates."
            rows={4}
            onChange={(event) =>
              updateMetadata("description", event.target.value)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}