import type { CustomToolManifest } from "./customToolTypes";

function nowIso() {
  return new Date().toISOString();
}

export function markCustomToolDraftTested(
  draft: CustomToolManifest,
): CustomToolManifest {
  return {
    ...draft,
    status: "tested",
    updatedAt: nowIso(),
  };
}

export function markCustomToolDraftPublished(
  draft: CustomToolManifest,
): CustomToolManifest {
  return {
    ...draft,
    status: "published",
    updatedAt: nowIso(),
  };
}

export function markCustomToolDraftEdited(
  draft: CustomToolManifest,
): CustomToolManifest {
  if (draft.status === "tested" || draft.status === "published") {
    return {
      ...draft,
      status: "draft",
      updatedAt: nowIso(),
    };
  }

  return {
    ...draft,
    updatedAt: nowIso(),
  };
}