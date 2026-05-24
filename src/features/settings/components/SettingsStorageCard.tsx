import { FolderOpen, RotateCcw, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getRefreshButtonText,
  nativeJsonStorageFiles,
  type RefreshPathStatus,
} from "@/features/settings/utils/settingsConstants";

type SettingsStorageCardProps = {
  appDataPath: string | null;
  appDataPathError: string | null;
  isOpeningDataFolder: boolean;
  refreshPathStatus: RefreshPathStatus;
  onOpenAppDataFolder: () => void;
  onRefreshAppDataPath: () => void;
};

export function SettingsStorageCard({
  appDataPath,
  appDataPathError,
  isOpeningDataFolder,
  refreshPathStatus,
  onOpenAppDataFolder,
  onRefreshAppDataPath,
}: SettingsStorageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderOpen className="h-5 w-5" />
          JSON saved files folder
        </CardTitle>

        <CardDescription>
          Workspace data is saved as native JSON files in the app data folder.
          UI preferences like theme and settings stay in localStorage.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {appDataPathError ? (
          <Alert>
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Could not load JSON storage folder</AlertTitle>
            <AlertDescription>{appDataPathError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium text-muted-foreground">
            Native JSON storage folder
          </p>
          <p className="mt-2 break-all font-mono text-sm">
            {appDataPath ?? "Loading native app data path..."}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Saved JSON files
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {nativeJsonStorageFiles.map((fileName) => (
                <Badge key={fileName} variant="outline" className="font-mono">
                  {fileName}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Storage type
            </p>
            <p className="mt-2 text-sm">
              Native desktop app-data JSON storage
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={onOpenAppDataFolder}
            disabled={!appDataPath || isOpeningDataFolder}
          >
            {isOpeningDataFolder ? (
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FolderOpen className="mr-2 h-4 w-4" />
            )}
            {isOpeningDataFolder ? "Opening folder..." : "Open JSON folder"}
          </Button>

          <Button
            variant="outline"
            onClick={onRefreshAppDataPath}
            disabled={refreshPathStatus === "refreshing"}
          >
            <RotateCcw
              className={`mr-2 h-4 w-4 ${
                refreshPathStatus === "refreshing" ? "animate-spin" : ""
              }`}
            />
            {getRefreshButtonText(refreshPathStatus)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}