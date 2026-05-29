import { Check, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SETTINGS_STORAGE_KEY } from "../../state";

type SettingsDiagnosticsCardProps = {
  selectedCscPath: string | null;
  theme: string;
  savedAt: string | null;
  resetMessage: string | null;
  isResetConfirming: boolean;
  onResetSettings: () => void;
};

export function SettingsDiagnosticsCard({
  selectedCscPath,
  theme,
  savedAt,
  resetMessage,
  isResetConfirming,
  onResetSettings,
}: SettingsDiagnosticsCardProps) {
  return (
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
              Click Confirm reset to restore default preferences and switch the
              theme back to system.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <InfoBlock
            label="Selected CSC folder"
            value={selectedCscPath ?? "No CSC folder selected yet."}
            breakAll
          />
          <InfoBlock label="Settings storage key" value={SETTINGS_STORAGE_KEY} breakAll />
          <InfoBlock label="Active theme" value={theme} />
          <InfoBlock
            label="Last saved"
            value={savedAt ? new Date(savedAt).toLocaleString() : "Not saved yet"}
          />
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
            onClick={onResetSettings}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {isResetConfirming ? "Confirm reset" : "Reset settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoBlock({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-2 font-mono text-sm ${breakAll ? "break-all" : ""}`}>
        {value}
      </p>
    </div>
  );
}