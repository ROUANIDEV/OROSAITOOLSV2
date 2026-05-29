import { FileSpreadsheet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DataDictionaryWorkspaceState } from "../../state";

type DataDictionarySummaryCardProps = {
  state: DataDictionaryWorkspaceState;
  isAnalyzing: boolean;
};

export function DataDictionarySummaryCard({
  state,
  isAnalyzing,
}: DataDictionarySummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
        <CardDescription>Latest analysis and export information.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {isAnalyzing ? (
          <SummarySkeleton />
        ) : state.analysis ? (
          <div className="grid gap-3 text-sm">
            <InfoRow label="Source files" value={state.analysis.sourceFiles} />
            <InfoRow label="Header files" value={state.analysis.headerFiles} />
            <InfoRow label="Constants" value={state.analysis.constantsCount} />
            <InfoRow
              label="Global variables"
              value={state.analysis.globalVariablesCount}
            />
            <InfoRow label="Data types" value={state.analysis.dataTypesCount} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Click Analyze Data Dictionary to show summary and tables.
          </div>
        )}

        {state.exportResult && (
          <>
            <Separator />
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">Generated file</p>
              </div>

              <p className="mt-2 break-all text-xs text-muted-foreground">
                {state.exportResult.outputPath}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}