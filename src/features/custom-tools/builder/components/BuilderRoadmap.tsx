import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { builderPhases } from "../model/builderData";

export function BuilderRoadmap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Builder roadmap</CardTitle>
        <CardDescription>
          This page is the shell for the visual builder. The next steps will add
          the data model, draft storage, block catalog, and runner.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2">
        {builderPhases.map((phase) => (
          <div key={phase.title} className="rounded-xl border p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
              <phase.icon className="size-5" />
            </div>

            <h3 className="font-semibold">{phase.title}</h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {phase.description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}