import type { CProjectWorkspaceState } from "@/features/c-project/state/cProjectWorkspaceState";
import { CProjectStatCard } from "@/features/c-project/shared/CProjectStatCard";

type CProjectSummaryStatsProps = {
  state: CProjectWorkspaceState;
};

export function CProjectSummaryStats({ state }: CProjectSummaryStatsProps) {
  if (!state.summary) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CProjectStatCard label="Total files" value={state.summary.totalFiles} />
      <CProjectStatCard label="C/C++ files" value={state.summary.cFiles} />
      <CProjectStatCard label="Header files" value={state.summary.headerFiles} />
      <CProjectStatCard label="CSC folders" value={state.cscFolders.length} />
    </section>
  );
}