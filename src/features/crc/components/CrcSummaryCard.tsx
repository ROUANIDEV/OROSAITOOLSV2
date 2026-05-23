import { Calculator, Clipboard, FileCode2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatInputFormat,
  type CrcDraft,
  type CrcInputFormat,
  type CrcPreset,
} from "@/features/crc/crc-config";
import { CrcInfoRow } from "@/features/crc/components/CrcUi";
import type { CrcCalculationResult } from "@/lib/crc";

type CrcSummaryCardProps = {
  inputFormat: CrcInputFormat;
  draft: CrcDraft;
  selectedPreset: CrcPreset | null;
  result: CrcCalculationResult | null;
  error: string | null;
  isCalculating: boolean;
};

export function CrcSummaryCard({
  inputFormat,
  draft,
  selectedPreset,
  result,
  error,
  isCalculating,
}: CrcSummaryCardProps) {
  async function handleCopyResult() {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.value);
    } catch {
      // Ignore clipboard permission errors.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
        <CardDescription>
          Current CRC configuration and calculation result.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <CrcInfoRow label="Input mode" value={formatInputFormat(inputFormat)} />
          <CrcInfoRow label="Width" value={`${draft.width || "—"} bit`} />
          <CrcInfoRow
            label="Preset"
            value={selectedPreset?.name ?? "Custom parameters"}
          />
          <CrcInfoRow
            label="Rust process"
            value={isCalculating ? "Running" : "Ready"}
          />
        </div>

        <Separator className="my-4" />

        {error && (
          <Alert variant="destructive">
            <Calculator className="size-4" />
            <AlertTitle>CRC calculation error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!error && !result && (
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center gap-2">
              <Calculator className="size-5 text-muted-foreground" />
              <p className="font-medium">Result output</p>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Click Calculate CRC to run the Rust CRC engine and show the result.
            </p>
          </div>
        )}

        {!error && result && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Hex
              </p>

              <div className="mt-2 flex items-center gap-2">
                <p className="min-w-0 flex-1 break-all font-mono text-2xl font-semibold tracking-tight">
                  {result.value}
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyResult}
                  title="Copy CRC value"
                >
                  <Clipboard className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              <ResultRow label="Decimal" value={result.decimal} />
              <ResultRow label="Binary" value={result.binary} />
              <ResultRow label="Bytes" value={result.bytes} />
              <ResultRow label="Mask" value={result.mask} />
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Normalized parameters</p>

              <div className="grid gap-2">
                <ResultRow
                  label="Polynomial"
                  value={result.normalized.polynomial}
                />
                <ResultRow
                  label="Reflected polynomial"
                  value={result.normalized.reflectedPolynomial}
                />
                <ResultRow label="Init" value={result.normalized.init} />
                <ResultRow label="Xorout" value={result.normalized.xorOut} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CrcProtocolNotesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode2 className="size-5" />
          Protocol notes
        </CardTitle>
        <CardDescription>
          Use this calculator for protocol-specific CRC definitions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Use the normal polynomial form without the leading x^width bit. For
          example, CRC-32 uses{" "}
          <code className="rounded bg-muted px-1">0x04C11DB7</code>.
        </p>

        <p>
          Rust calculation supports widths from <strong>1</strong> to{" "}
          <strong>128</strong> bits using native <code>u128</code> math.
        </p>

        <p>
          Each calculation runs through a separate Tauri command task, so the UI
          remains responsive while CRC work is running.
        </p>
      </CardContent>
    </Card>
  );
}

function ResultRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-card px-3 py-2">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="break-all text-right font-mono text-sm">{value}</span>
    </div>
  );
}