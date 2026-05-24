import type {
  ReportDetails,
  ReportFilter,
  ReportStatus,
} from "@/features/reports/types/reportsTypes";
import { reportMatchesSearch } from "@/features/reports/utils/reportsUtils";

export type ReportsCounts = {
  total: number;
  generated: number;
  analyzed: number;
  waiting: number;
  ready: number;
};

export type ReportFilterOption = {
  value: ReportFilter;
  label: string;
  count: number;
};

export function getReportsCounts(reports: ReportDetails[]): ReportsCounts {
  const countByStatus = (status: ReportStatus) =>
    reports.filter((report) => report.status === status).length;

  const generated = countByStatus("generated");
  const analyzed = countByStatus("analyzed");
  const waiting = countByStatus("waiting");

  return {
    total: reports.length,
    generated,
    analyzed,
    waiting,
    ready: generated + analyzed,
  };
}

export function getReportFilterOptions(
  reports: ReportDetails[],
): ReportFilterOption[] {
  const counts = getReportsCounts(reports);

  return [
    { value: "all", label: "All", count: counts.total },
    { value: "generated", label: "Generated", count: counts.generated },
    { value: "analyzed", label: "Analysis ready", count: counts.analyzed },
    { value: "waiting", label: "Not generated", count: counts.waiting },
  ];
}

export function getVisibleReports({
  reports,
  statusFilter,
  searchQuery,
}: {
  reports: ReportDetails[];
  statusFilter: ReportFilter;
  searchQuery: string;
}): ReportDetails[] {
  return reports.filter((report) => {
    const matchesFilter =
      statusFilter === "all" || report.status === statusFilter;

    return matchesFilter && reportMatchesSearch(report, searchQuery);
  });
}