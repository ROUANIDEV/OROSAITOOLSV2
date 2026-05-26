import type { CustomToolManifest } from "../../model/customToolTypes";
import type { TestInputValues } from "./testRunTypes";

export function createInitialTestValues(
  draft: CustomToolManifest,
): TestInputValues {
  return Object.fromEntries(
    draft.inputs.map((input) => {
      if (input.type === "boolean") {
        return [input.id, false];
      }

      if (input.type === "number") {
        return [input.id, 0];
      }

      return [input.id, ""];
    }),
  );
}