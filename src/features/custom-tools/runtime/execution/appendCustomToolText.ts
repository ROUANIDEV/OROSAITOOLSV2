import { invokeTauriCommand } from "@/api/tauri/invokeTauriCommand";
import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

export type CustomToolAppendTextResult = {
  targetPath: string;
  bytesAppended: number;
};

type AppendCustomToolTextArgs = {
  targetPath: string;
  text: string;
  confirmation: string;
  fileWritePermission: boolean;
};

export async function appendCustomToolText({
  targetPath,
  text,
  confirmation,
  fileWritePermission,
}: AppendCustomToolTextArgs): Promise<CustomToolAppendTextResult> {
  return await invokeTauriCommand<CustomToolAppendTextResult>(
    tauriCommandNames.customToolAppendText,
    {
      targetPath,
      text,
      confirmation,
      fileWritePermission,
    },
  );
}