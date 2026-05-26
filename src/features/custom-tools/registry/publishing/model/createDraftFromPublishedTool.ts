import type { CustomToolManifest } from "@/features/custom-tools/domain/customToolTypes";

export function createDraftFromPublishedTool(
  tool: CustomToolManifest,
): CustomToolManifest {
  return {
    ...tool,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}