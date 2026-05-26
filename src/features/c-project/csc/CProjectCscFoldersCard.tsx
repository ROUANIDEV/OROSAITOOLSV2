import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CProjectWorkspaceState } from "@/features/c-project/state/cProjectWorkspaceState";
import { CProjectCscFolderSelect } from "@/features/c-project/csc/CProjectCscFolderSelect";
import { CProjectCscFoldersTable } from "@/features/c-project/csc/CProjectCscFoldersTable";

type CProjectCscFoldersCardProps = {
  state: CProjectWorkspaceState;
  isScanning: boolean;
  onSelectCsc: (path: string) => void;
};

export function CProjectCscFoldersCard({
  state,
  isScanning,
  onSelectCsc,
}: CProjectCscFoldersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detected CSC folders</CardTitle>
        <CardDescription>
          Select the CSC that Call Tree and Data Dictionary should use.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {state.cscFolders.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No CSC folders detected yet.
          </div>
        ) : (
          <>
            <CProjectCscFolderSelect
              state={state}
              isScanning={isScanning}
              onSelectCsc={onSelectCsc}
            />

            <CProjectCscFoldersTable
              state={state}
              isScanning={isScanning}
              onSelectCsc={onSelectCsc}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}