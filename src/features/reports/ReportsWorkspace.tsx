import { useMemo, useState } from "react";

import { loadAppSettings } from "@/features/settings/settings-state";
import { buildReports } from "@/features/reports/reportModels";
import {
  getReportFilterOptions,
  getReportsCounts,
  getVisibleReports,
} from "@/features/reports/reportsFilters";
import type {
  ReportFilter,
  ReportsWorkspaceProps,
} from "@/features/reports/reportsTypes";
import { ReportsFiltersCard } from "@/features/reports/ReportsFiltersCard";
import { ReportsList } from "@/features/reports/ReportsList";
import { ReportsOverviewCard } from "@/features/reports/ReportsOverviewCard";
import { useReportsActions } from "@/features/reports/useReportsActions";

export function ReportsWorkspace({
  selectedCscPath,
  callTreeState,
  dataDictionaryState,
  onToolChange,
}: ReportsWorkspaceProps) {
  const { compactReportCards } = loadAppSettings();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportFilter>("all");

  const reports = useMemo(
    () =>
      buildReports({
        selectedCscPath,
        callTreeState,
        dataDictionaryState,
      }),
    [callTreeState, dataDictionaryState, selectedCscPath],
  );

  const counts = useMemo(() => getReportsCounts(reports), [reports]);

  const filterOptions = useMemo(
    () => getReportFilterOptions(reports),
    [reports],
  );

  const visibleReports = useMemo(
    () =>
      getVisibleReports({
        reports,
        searchQuery,
        statusFilter,
      }),
    [reports, searchQuery, statusFilter],
  );

  const {
    copyStatus,
    openStatus,
    reportsFolderStatus,
    handleCopyPath,
    handleOpenFolder,
    handleOpenReportsFolder,
  } = useReportsActions({ selectedCscPath });

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <ReportsOverviewCard
        selectedCscPath={selectedCscPath}
        generatedReportsCount={counts.generated}
        totalReportsCount={counts.total}
        readyReportsCount={counts.ready}
        compactReportCards={compactReportCards}
        reportsFolderStatus={reportsFolderStatus}
        onToolChange={onToolChange}
        onOpenReportsFolder={() => void handleOpenReportsFolder()}
      />

      <ReportsFiltersCard
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        filterOptions={filterOptions}
        visibleReportsCount={visibleReports.length}
        totalReportsCount={reports.length}
        onSearchQueryChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onResetFilters={resetFilters}
      />

      <ReportsList
        reports={visibleReports}
        compact={compactReportCards}
        copyStatus={copyStatus}
        openStatus={openStatus}
        onCopyPath={(report) => void handleCopyPath(report)}
        onOpenFolder={(report) => void handleOpenFolder(report)}
        onToolChange={onToolChange}
        onResetFilters={resetFilters}
      />
    </main>
  );
}