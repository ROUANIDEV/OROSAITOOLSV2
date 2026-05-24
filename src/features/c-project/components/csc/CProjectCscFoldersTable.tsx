import { CheckCircle2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import type { CProjectWorkspaceState } from "@/features/c-project/c-project-state";

type CProjectCscFoldersTableProps = {
  state: CProjectWorkspaceState;
  isScanning: boolean;
  onSelectCsc: (path: string) => void;
};

export function CProjectCscFoldersTable({
  state,
  isScanning,
  onSelectCsc,
}: CProjectCscFoldersTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableBody>
          {state.cscFolders.map((folder) => (
            <TableRow
              key={folder.path}
              className={state.selectedCscPath === folder.path ? "bg-muted/60" : ""}
            >
              <TableCell className="font-medium">
                <button
                  type="button"
                  onClick={() => onSelectCsc(folder.path)}
                  disabled={isScanning}
                  className="flex w-full items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {state.selectedCscPath === folder.path && (
                    <CheckCircle2 className="size-4 text-primary" />
                  )}
                  <span className="break-all">
                    {folder.relativePath || folder.name}
                  </span>
                </button>
              </TableCell>

              <TableCell className="text-right text-muted-foreground">
                {folder.cFiles} C / {folder.headerFiles} H
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}