export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type SaveState = {
  status: SaveStatus;
  updatedAtMs: number | null;
  errorMessage: string | null;
};

export function createIdleSaveState(): SaveState {
  return {
    status: "idle",
    updatedAtMs: null,
    errorMessage: null,
  };
}

export function createSavingState(previousState: SaveState): SaveState {
  return {
    ...previousState,
    status: "saving",
    errorMessage: null,
  };
}

export function createSavedState(updatedAtMs = Date.now()): SaveState {
  return {
    status: "saved",
    updatedAtMs,
    errorMessage: null,
  };
}

export function createSaveErrorState(error: unknown): SaveState {
  return {
    status: "error",
    updatedAtMs: null,
    errorMessage: error instanceof Error ? error.message : "Unable to save changes.",
  };
}
