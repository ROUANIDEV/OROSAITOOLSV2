import { Clock3, History, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatCrcHistoryDate,
  type CrcHistoryEntry,
} from "@/features/crc/crc-history";
import { formatInputFormat } from "@/features/crc/crc-config";

type CrcHistoryCardProps = {
  history: CrcHistoryEntry[];
  onRestore: (entry: CrcHistoryEntry) => void;
  onClear: () => void;
};

export function CrcHistoryCard({
  history,
  onRestore,
  onClear,
}: CrcHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5" />
              Calculation history
            </CardTitle>
            <CardDescription>
              Recently calculated CRC values are memorized on this device.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={history.length === 0}
          >
            <Trash2 className="size-4" />
            Clear history
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
            <Clock3 className="mx-auto mb-3 size-7 text-muted-foreground" />
            <p className="font-medium">No CRC calculations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your latest calculations will appear here after you click
              Calculate CRC.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border bg-card p-4 transition hover:bg-accent/50"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary px-2 py-1 font-mono text-xs font-medium text-primary-foreground">
                        {entry.result.value}
                      </span>

                      <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                        {entry.presetName}
                      </span>

                      <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                        {formatInputFormat(entry.inputFormat)}
                      </span>
                    </div>

                    <p className="break-all text-sm text-muted-foreground">
                      {entry.payloadPreview}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatCrcHistoryDate(entry.createdAt)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onRestore(entry)}
                    className="shrink-0"
                  >
                    <RotateCcw className="size-4" />
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}