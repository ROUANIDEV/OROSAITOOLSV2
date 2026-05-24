import { FileCode2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CProjectScanSummary } from "@/lib/cProject";

type ProjectScanPanelProps = {
  summary?: CProjectScanSummary | null;
  result?: CProjectScanSummary | null;
  isScanning?: boolean;
  [key: string]: unknown;
};

export function ProjectScanPanel({
  summary,
  result,
  isScanning = false,
}: ProjectScanPanelProps) {
  const scanSummary = summary ?? result ?? null;

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary">Legacy panel</Badge>
          {isScanning && <Badge variant="outline">Scanning</Badge>}
        </div>

        <CardTitle className="flex items-center gap-2">
          <FileCode2 className="size-5" />
          Project scan summary
        </CardTitle>

        <CardDescription>
          This panel is kept for compatibility. The new scanner workspace is
          `CProjectWorkspace`.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!scanSummary ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No project scan summary available.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryItem label="Total files" value={scanSummary.totalFiles} />
            <SummaryItem label="C/C++ files" value={scanSummary.cFiles} />
            <SummaryItem
              label="Header files"
              value={scanSummary.headerFiles}
            />
            <SummaryItem
              label="Assembly files"
              value={scanSummary.assemblyFiles}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}