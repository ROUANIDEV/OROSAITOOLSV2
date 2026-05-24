import { Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AppSettings } from "@/features/settings/settings-state";
import type { PreferenceItem } from "@/features/settings/utils/settingsConstants";

type SettingsPreferencesCardProps = {
  preferenceItems: PreferenceItem[];
  onUpdateSetting: <Key extends keyof AppSettings>(
    key: Key,
    value: AppSettings[Key],
  ) => void;
};

export function SettingsPreferencesCard({
  preferenceItems,
  onUpdateSetting,
}: SettingsPreferencesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-5 w-5" />
          Preferences
        </CardTitle>

        <CardDescription>
          These values are saved locally in the desktop app.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3">
        {preferenceItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-lg border p-4"
          >
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>

            <Button
              variant={item.enabled ? "default" : "outline"}
              onClick={() => onUpdateSetting(item.key, !item.enabled)}
            >
              {item.enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}