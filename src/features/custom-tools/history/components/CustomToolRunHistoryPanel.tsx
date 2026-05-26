import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { CustomToolManifest } from "../../model/customToolTypes";
import { TestRunBlockOutputs } from "../../runtime/components/TestRunBlockOutputs";
import { TestRunLogs } from "../../runtime/components/TestRunLogs";
import { loadCustomToolRunHistory } from "../storage/customToolRunHistoryStorage";
import type { CustomToolRunHistoryEntry } from "../model/customToolRunHistoryTypes";

type CustomToolRunHistoryPanelProps = {
  tool: CustomToolManifest;
  refreshSignal: number;
};

function formatRunKind(runKind: CustomToolRunHistoryEntry["runKind"]) {
  return runKind === "dry-run" ? "Dry run" : "Confirmed run";
}

function formatRunTime(createdAt: string) {
  return new Date(createdAt).toLocaleString();
}

export function CustomToolRunHistoryPanel({
  tool,
  refreshSignal,
}: CustomToolRunHistoryPanelProps) {
  const [entries, setEntries] = useState<CustomToolRunHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      setIsLoading(true);
      const nextEntries = await loadCustomToolRunHistory(tool.id);

      if (isMounted) {
        setEntries(nextEntries);
        setIsLoading(false);
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [tool.id, refreshSignal]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution history</CardTitle>
        <CardDescription>
          Recent local runs for this published tool. History stays private in
          app data.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading history...</p>
        ) : null}

        {!isLoading && entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Run this published tool to start building local history.
          </p>
        ) : null}

        {entries.map((entry) => (
          <details key={entry.id} className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              {formatRunKind(entry.runKind)} · {entry.status} ·{" "}
              {formatRunTime(entry.createdAt)}
            </summary>

            <div className="mt-3 space-y-3">
              {entry.errorMessage ? (
                <p className="text-sm text-destructive">
                  {entry.errorMessage}
                </p>
              ) : null}

              <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                <p>Append previews: {entry.appendPreviewCount}</p>
                <p>Bytes appended: {entry.bytesAppended ?? 0}</p>
              </div>

              <TestRunLogs logs={entry.logs} />
              <TestRunBlockOutputs
                blocks={tool.workflow.blocks}
                outputs={entry.outputByBlockId}
              />
            </div>
          </details>
        ))}
      </CardContent>
    </Card>
  );
}