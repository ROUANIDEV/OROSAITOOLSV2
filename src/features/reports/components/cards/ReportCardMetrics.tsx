import { ReportDetails } from "../../model";

type ReportCardMetricsProps = {
  report: ReportDetails;
  compact: boolean;
};

export function ReportCardMetrics({ report, compact }: ReportCardMetricsProps) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        {report.metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-1 font-medium">{metric.value}</p>
          </div>
        ))}
      </div>

      {!compact ? (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-medium">Output path</p>
          <p className="mt-2 break-all text-xs text-muted-foreground">
            {report.outputPath ??
              "Generate this report first to see the output path."}
          </p>
        </div>
      ) : null}
    </>
  );
}