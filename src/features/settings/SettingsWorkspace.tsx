import { useEffect, useState } from "react";
import {
  Check,
  Database,
  FileSpreadsheet,
  Laptop,
  Moon,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Sun,
  TriangleAlert,
} from "lucide-react";

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
import type { ToolId } from "@/features/dashboard/tool-config";
import {
  clearWorkspaceData,
  defaultSettings,
  loadAppSettings,
  saveAppSettings,
  SETTINGS_STORAGE_KEY,
  type AppSettings,
} from "@/features/settings/settings-state";
import { useTheme } from "@/features/theme/theme-provider";

type SettingsWorkspaceProps = {
  selectedCscPath: string | null;
  onToolChange: (tool: ToolId) => void;
};

const themeOptions = [
  {
    value: "light",
    label: "Light",
    description: "Use a bright interface.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Use a dark interface.",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow the operating system.",
    icon: Laptop,
  },
] as const;

export function SettingsWorkspace({
  selectedCscPath,
  onToolChange,
}: SettingsWorkspaceProps) {
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<AppSettings>(() =>
    loadAppSettings(),
  );

  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    saveAppSettings(settings);
    setSavedAt(new Date().toISOString());
  }, [settings]);

  useEffect(() => {
    if (!isResetConfirming) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsResetConfirming(false);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isResetConfirming]);

  useEffect(() => {
    if (!resetMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setResetMessage(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resetMessage]);

  function updateSetting<Key extends keyof AppSettings>(
    key: Key,
    value: AppSettings[Key],
  ) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));

    setResetMessage(null);
  }

  function handleResetSettings() {
    if (!isResetConfirming) {
      setIsResetConfirming(true);
      setResetMessage(null);
      return;
    }

    saveAppSettings(defaultSettings);
    clearWorkspaceData();

    setSettings(defaultSettings);
    setTheme("system");
    setIsResetConfirming(false);
    setResetMessage("Settings and workspace data were reset.");
  }

  const preferenceItems = [
    {
      key: "rememberLastTool",
      title: "Remember last opened tool",
      description:
        "Keep the dashboard on the last workspace you used when the app opens again.",
      enabled: settings.rememberLastTool,
    },
    {
      key: "autoOpenReportsAfterExport",
      title: "Open Reports after export",
      description:
        "After generating an Excel report, jump directly to the Reports workspace.",
      enabled: settings.autoOpenReportsAfterExport,
    },
    {
      key: "compactReportCards",
      title: "Compact report cards",
      description:
        "Use smaller report cards when the Reports workspace gets more report types.",
      enabled: settings.compactReportCards,
    },
  ] satisfies Array<{
    key: keyof Pick<
      AppSettings,
      "rememberLastTool" | "autoOpenReportsAfterExport" | "compactReportCards"
    >;
    title: string;
    description: string;
    enabled: boolean;
  }>;

  return (
    <section className="grid gap-6">
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

      <div className="grid gap-4 lg:grid-cols-2">
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
                  onClick={() => {
                    setTheme(option.value);
                    setResetMessage(null);
                  }}
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
                  onClick={() => updateSetting(item.key, !item.enabled)}
                >
                  {item.enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5" />
            Workspace diagnostics
          </CardTitle>

          <CardDescription>
            Current local state keys and selected project information.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          {resetMessage ? (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertTitle>Settings reset</AlertTitle>
              <AlertDescription>{resetMessage}</AlertDescription>
            </Alert>
          ) : null}

          {isResetConfirming ? (
            <Alert>
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Confirm reset</AlertTitle>
              <AlertDescription>
                Click Confirm reset to restore default preferences and switch
                the theme back to system.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Selected CSC folder
              </p>
              <p className="mt-2 break-all font-mono text-sm">
                {selectedCscPath ?? "No CSC folder selected yet."}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Settings storage key
              </p>
              <p className="mt-2 break-all font-mono text-sm">
                {SETTINGS_STORAGE_KEY}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Active theme
              </p>
              <p className="mt-2 font-mono text-sm">{theme}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Last saved
              </p>
              <p className="mt-2 font-mono text-sm">
                {savedAt ? new Date(savedAt).toLocaleString() : "Not saved yet"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">Reset local settings</p>
              <p className="text-sm text-muted-foreground">
                Restore default settings and switch theme back to system.
              </p>
            </div>

            <Button
              variant={isResetConfirming ? "destructive" : "outline"}
              onClick={handleResetSettings}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isResetConfirming ? "Confirm reset" : "Reset settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-5 w-5" />
            Step status
          </CardTitle>

          <CardDescription>
            Reset settings now also clears saved workspace data without adding
            new Settings UI controls.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Badge variant="secondary">
            <Save className="mr-1 h-3 w-3" />
            Auto-saved locally
          </Badge>
        </CardContent>
      </Card>
    </section>
  );
}