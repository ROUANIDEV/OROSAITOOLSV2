import { RefreshCw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ReportFilter, ReportFilterOption } from "../../model";

type ReportsFiltersCardProps = {
  searchQuery: string;
  statusFilter: ReportFilter;
  filterOptions: ReportFilterOption[];
  visibleReportsCount: number;
  totalReportsCount: number;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: ReportFilter) => void;
  onResetFilters: () => void;
};

export function ReportsFiltersCard({
  searchQuery,
  statusFilter,
  filterOptions,
  visibleReportsCount,
  totalReportsCount,
  onSearchQueryChange,
  onStatusFilterChange,
  onResetFilters,
}: ReportsFiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="size-4" />
          Find reports
        </CardTitle>

        <CardDescription>
          Filter report cards by status or search by name, file name,
          description, or output path.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search reports..."
        />

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilterChange(option.value)}
            >
              {option.label}
              <Badge variant="secondary">{option.count}</Badge>
            </Button>
          ))}

          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            <RefreshCw className="size-4" />
            Reset filters
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {visibleReportsCount} of {totalReportsCount} report
          {totalReportsCount === 1 ? "" : "s"}.
        </p>
      </CardContent>
    </Card>
  );
}