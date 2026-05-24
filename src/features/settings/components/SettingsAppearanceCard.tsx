import { Check, Sun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { themeOptions } from "@/features/settings/utils/settingsConstants";

type ThemeValue = (typeof themeOptions)[number]["value"];

type SettingsAppearanceCardProps = {
  theme: string;
  onThemeChange: (theme: ThemeValue) => void;
};

export function SettingsAppearanceCard({
  theme,
  onThemeChange,
}: SettingsAppearanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sun className="h-5 w-5" />
          Appearance
        </CardTitle>

        <CardDescription>
          Choose how the application theme should be applied.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onThemeChange(option.value)}
              className="flex items-center justify-between gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
            >
              <span className="flex items-center gap-3">
                <span className="rounded-lg border bg-muted/40 p-2">
                  <Icon className="h-4 w-4" />
                </span>

                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </span>

              {isActive ? (
                <Badge>
                  <Check className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline">Select</Badge>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}