import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardStats,
  tools,
  type ToolId,
} from "@/features/dashboard/tool-config";

type DashboardOverviewProps = {
  onToolChange: (tool: ToolId) => void;
};

export function DashboardOverview({ onToolChange }: DashboardOverviewProps) {
  const visibleTools = tools.filter((tool) => tool.id !== "overview");

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.6fr] lg:p-8">
          <div className="flex flex-col justify-center gap-4">
            <Badge variant="secondary" className="w-fit gap-2">
              <Sparkles className="size-3.5" />
              shadcn dashboard workspace
            </Badge>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
                OROSAITOOLS Dashboard
              </h1>

              <p className="max-w-2xl text-muted-foreground">
                A modular desktop workspace for scanning C projects, selecting
                CSC folders, generating call trees, and exporting engineering
                reports.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => onToolChange("c-project")}>
                Start with C Project Scanner
                <ArrowRight className="size-4" />
              </Button>

              <Button
                variant="outline"
                onClick={() => onToolChange("reports")}
              >
                View generated reports
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl bg-muted/50 p-4">
            {dashboardStats.map((stat) => (
              <div
                key={stat.title}
                className="flex items-center gap-3 rounded-lg border bg-background p-3"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <stat.icon className="size-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium">{stat.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>

                <div className="ml-auto text-xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleTools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToolChange(tool.id)}
            className="group text-left"
          >
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <tool.icon className="size-5" />
                </div>

                <CardTitle className="flex items-center justify-between gap-3">
                  <span>{tool.title}</span>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1" />
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
      </section>
    </main>
  );
}