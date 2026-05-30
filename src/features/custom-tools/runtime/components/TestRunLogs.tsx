import { Badge } from "@/components/ui/badge";
import type { TestRunLog } from "../state/testRunTypes";

type TestRunLogsProps = {
  logs: TestRunLog[];
};

const badgeVariantByLevel: Record<
  TestRunLog["level"],
  "secondary" | "outline" | "destructive"
> = {
  info: "outline",
  warning: "secondary",
  error: "destructive",
  success: "secondary",
};

export function TestRunLogs({ logs }: TestRunLogsProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No run messages yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Run messages</h4>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 rounded-2xl border bg-card p-3 text-sm">
            <Badge variant={badgeVariantByLevel[log.level]}>{log.level}</Badge>
            <p>{log.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
