import { FileSpreadsheet, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SettingsStatusCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="h-5 w-5" />
          Step status
        </CardTitle>

        <CardDescription>
          Reset settings now also clears saved workspace data without adding new
          Settings UI controls.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Badge variant="secondary">
          <Save className="mr-1 h-3 w-3" />
          Auto-saved locally
        </Badge>
      </CardContent>
    </Card>
  );
}