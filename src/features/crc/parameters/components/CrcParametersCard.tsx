import type { Dispatch, SetStateAction } from "react";

import { Cpu, Hash } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CrcDraft, CrcPreset } from "../../model";
import { CrcField, CrcToggleCard } from "../../workspace";

type CrcParametersCardProps = {
  draft: CrcDraft;
  selectedPreset: CrcPreset | null;
  disabled?: boolean;
  onDraftChange: Dispatch<SetStateAction<CrcDraft>>;
  onCustomMode: () => void;
};

export function CrcParametersCard({
  draft,
  selectedPreset,
  disabled = false,
  onDraftChange,
  onCustomMode,
}: CrcParametersCardProps) {
  function updateDraft(key: keyof CrcDraft, value: string | boolean) {
    onCustomMode();

    onDraftChange((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="size-5" />
          CRC parameters
        </CardTitle>
        <CardDescription>
          Configure any CRC protocol. Plain values are treated as hexadecimal.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <CrcField label="Width">
            <Input
              value={draft.width}
              disabled={disabled}
              onChange={(event) => updateDraft("width", event.target.value)}
              inputMode="numeric"
              placeholder="32"
            />
          </CrcField>

          <CrcField label="Polynomial">
            <Input
              value={draft.polynomial}
              disabled={disabled}
              onChange={(event) =>
                updateDraft("polynomial", event.target.value)
              }
              placeholder="0x04C11DB7"
            />
          </CrcField>

          <CrcField label="Initial value">
            <Input
              value={draft.init}
              disabled={disabled}
              onChange={(event) => updateDraft("init", event.target.value)}
              placeholder="0xFFFFFFFF"
            />
          </CrcField>

          <CrcField label="Xorout">
            <Input
              value={draft.xorOut}
              disabled={disabled}
              onChange={(event) => updateDraft("xorOut", event.target.value)}
              placeholder="0xFFFFFFFF"
            />
          </CrcField>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <CrcToggleCard
            title="Reflect input"
            description="Process each input byte least-significant-bit first."
            checked={draft.reflectIn}
            onChange={(checked) => updateDraft("reflectIn", checked)}
          />

          <CrcToggleCard
            title="Reflect output"
            description="Reflect the final register when required by the protocol."
            checked={draft.reflectOut}
            onChange={(checked) => updateDraft("reflectOut", checked)}
          />
        </div>

        {selectedPreset && (
          <Alert>
            <Hash className="size-4" />
            <AlertTitle>{selectedPreset.name}</AlertTitle>
            <AlertDescription>
              Check value for{" "}
              <code className="rounded bg-muted px-1">123456789</code>:{" "}
              <strong>{selectedPreset.check}</strong>.{" "}
              {selectedPreset.description}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}