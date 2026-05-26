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
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        No dry run logs yet.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border p-3 text-sm">
          <div className="mb-1">
            <Badge variant={badgeVariantByLevel[log.level]}>{log.level}</Badge>
          </div>

          <p className="text-muted-foreground">{log.message}</p>
        </div>
      ))}
    </div>
  );
}