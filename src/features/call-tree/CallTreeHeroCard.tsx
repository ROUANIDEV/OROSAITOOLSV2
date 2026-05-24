import { GitBranch, Loader2, PlayCircle, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CallTreeWorkspaceState } from "@/features/call-tree/call-tree-state";
import { CallTreeStatusAlerts } from "@/features/call-tree/CallTreeStatusAlerts";

type CallTreeHeroCardProps = {
  selectedCscPath: string | null;
  state: CallTreeWorkspaceState;
  isAnalyzing: boolean;
  isExporting: boolean;
  canRun: boolean;
  onAnalyze: () => void;
  onExport: () => void;
  onGoToCProjectScanner: () => void;
};

export function CallTreeHeroCard({
  selectedCscPath,
  state,
  isAnalyzing,
  isExporting,
  canRun,
  onAnalyze,
  onExport,
  onGoToCProjectScanner,
}: CallTreeHeroCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Workspace</Badge>
          <Badge variant="outline">Call Tree</Badge>
        </div>

        <CardTitle className="flex items-center gap-2 text-2xl">
          <GitBranch className="size-6" />
          Call Tree
        </CardTitle>

        <CardDescription>
          Analyze function relationships from the selected CSC, preview the
          result, then export call_tree.xlsx.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">Selected CSC path</p>
          <p className="mt-2 break-all text-sm text-muted-foreground">
            {selectedCscPath ?? "No CSC selected yet."}
          </p>
        </div>

        <CallTreeStatusAlerts
          selectedCscPath={selectedCscPath}
          state={state}
          isAnalyzing={isAnalyzing}
        />

        <div className="flex flex-wrap gap-3">
          <Button onClick={onAnalyze} disabled={!canRun}>
            {isAnalyzing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Analyze Call Tree
          </Button>

          <Button onClick={onExport} disabled={!canRun}>
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PlayCircle className="size-4" />
            )}
            Generate call_tree.xlsx
          </Button>

          <Button variant="outline" onClick={onGoToCProjectScanner}>
            Select CSC folder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}