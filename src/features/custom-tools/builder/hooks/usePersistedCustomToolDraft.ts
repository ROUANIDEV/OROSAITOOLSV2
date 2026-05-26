import { useEffect, useState } from "react";

import type { CustomToolManifest } from "../../model/customToolTypes";
import {
  deleteCurrentCustomToolDraft,
  loadCurrentCustomToolDraft,
  saveCurrentCustomToolDraft,
} from "../../persistence/customToolDraftStorage";

export type DraftSaveStatus = "loading" | "idle" | "saving" | "saved" | "error";

export function usePersistedCustomToolDraft() {
  const [draft, setDraft] = useState<CustomToolManifest | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadDraft() {
      const savedDraft = await loadCurrentCustomToolDraft();

      if (!isMounted) {
        return;
      }

      setDraft(savedDraft);
      setHasLoaded(true);
      setSaveStatus(savedDraft ? "saved" : "idle");
    }

    loadDraft();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    let isCancelled = false;

    async function persistDraft() {
      try {
        setSaveStatus("saving");

        if (draft) {
          await saveCurrentCustomToolDraft(draft);
        } else {
          await deleteCurrentCustomToolDraft();
        }

        if (!isCancelled) {
          setSaveStatus(draft ? "saved" : "idle");
        }
      } catch (error) {
        console.error("Failed to save custom tool draft.", error);

        if (!isCancelled) {
          setSaveStatus("error");
        }
      }
    }

    persistDraft();

    return () => {
      isCancelled = true;
    };
  }, [draft, hasLoaded]);

  return {
    draft,
    setDraft,
    saveStatus,
  };
}