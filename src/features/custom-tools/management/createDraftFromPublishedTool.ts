import type { CustomToolManifest } from "@/features/custom-tools/model/customToolTypes";

export function createDraftFromPublishedTool(
  tool: CustomToolManifest,
): CustomToolManifest {
  return {
    ...tool,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}