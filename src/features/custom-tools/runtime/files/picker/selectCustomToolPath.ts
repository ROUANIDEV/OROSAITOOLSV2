import { open } from "@tauri-apps/plugin-dialog";

export type SelectCustomToolPathMode = "file" | "folder";

type SelectCustomToolPathArgs = {
  mode: SelectCustomToolPathMode;
  title?: string;
};

export async function selectCustomToolPath({
  mode,
  title,
}: SelectCustomToolPathArgs): Promise<string | null> {
  const selectedPath = await open({
    title:
      title ??
      (mode === "folder" ? "Select input folder" : "Select input file"),
    multiple: false,
    directory: mode === "folder",
  });

  if (!selectedPath || Array.isArray(selectedPath)) {
    return null;
  }

  return selectedPath;
}