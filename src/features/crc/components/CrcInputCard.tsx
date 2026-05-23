import type { Dispatch, SetStateAction } from "react";

import { Binary } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  crcExampleInputs,
  crcPresets,
  getInputPlaceholder,
  type CrcInputFormat,
} from "@/features/crc/crc-config";
import {
  CrcField,
  crcSelectClassName,
} from "@/features/crc/components/CrcUi";

type CrcInputCardProps = {
  selectedPresetId: string;
  inputFormat: CrcInputFormat;
  payload: string;
  disabled?: boolean;
  onPresetChange: (presetId: string) => void;
  onInputFormatChange: (format: CrcInputFormat) => void;
  onPayloadChange: Dispatch<SetStateAction<string>>;
};

export function CrcInputCard({
  selectedPresetId,
  inputFormat,
  payload,
  disabled = false,
  onPresetChange,
  onInputFormatChange,
  onPayloadChange,
}: CrcInputCardProps) {
  function handleInputFormatChange(format: CrcInputFormat) {
    onInputFormatChange(format);
    onPayloadChange(crcExampleInputs[format]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Binary className="size-5" />
          Input payload
        </CardTitle>
        <CardDescription>
          Choose how the payload should be parsed before CRC calculation.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <CrcField label="Input format">
            <select
              value={inputFormat}
              disabled={disabled}
              onChange={(event) =>
                handleInputFormatChange(event.target.value as CrcInputFormat)
              }
              className={crcSelectClassName}
            >
              <option value="text">Text / UTF-8</option>
              <option value="hex">Hex bytes</option>
              <option value="binary">Binary bytes</option>
              <option value="bytes">Byte list</option>
            </select>
          </CrcField>

          <CrcField label="Protocol preset">
            <select
              value={selectedPresetId}
              disabled={disabled}
              onChange={(event) => onPresetChange(event.target.value)}
              className={crcSelectClassName}
            >
              <option value="custom">Custom parameters</option>

              {crcPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </CrcField>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Payload</label>
          <textarea
            value={payload}
            disabled={disabled}
            onChange={(event) => onPayloadChange(event.target.value)}
            spellCheck={false}
            placeholder={getInputPlaceholder(inputFormat)}
            className="min-h-40 w-full resize-y rounded-lg border bg-background px-3 py-3 font-mono text-sm shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </CardContent>
    </Card>
  );
}