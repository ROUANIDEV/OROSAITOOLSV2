import { Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToolId } from "@/features/dashboard";

type SettingsHeaderCardProps = {
  onToolChange: (tool: ToolId) => void;
};

export function SettingsHeaderCard({ onToolChange }: SettingsHeaderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Workspace</Badge>
          <Badge variant="outline">Settings</Badge>
          <Badge variant="outline">Local preferences</Badge>
        </div>

        <CardTitle className="flex items-center gap-2 text-2xl">
          <Settings2 className="h-6 w-6" />
          Settings
        </CardTitle>

        <CardDescription>
          Configure the desktop workspace appearance, local preferences, and
          navigation shortcuts.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => onToolChange("overview")}>
            Open Dashboard
          </Button>

          <Button variant="outline" onClick={() => onToolChange("reports")}>
            Open Reports
          </Button>

          <Button variant="outline" onClick={() => onToolChange("c-project")}>
            Select CSC Folder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}