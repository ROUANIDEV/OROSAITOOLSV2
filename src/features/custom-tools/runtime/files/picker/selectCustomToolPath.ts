import { open } from "@tauri-apps/plugin-dialog";

export type CustomToolPathPickerMode = "file" | "folder";

export type SelectCustomToolPathOptions = {
  mode: CustomToolPathPickerMode;
  title?: string;
};

export async function selectCustomToolPath({
  mode,
  title,
}: SelectCustomToolPathOptions): Promise<string> {
  const selected = await open({
    title,
    directory: mode === "folder",
    multiple: false,
  });

  if (Array.isArray(selected)) {
    return typeof selected[0] === "string" ? selected[0] : "";
  }

  return typeof selected === "string" ? selected : "";
}
