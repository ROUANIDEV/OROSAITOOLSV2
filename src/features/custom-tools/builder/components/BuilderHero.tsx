import { PlusCircle, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { historyTemplateAction, safetyCards } from "../state/builderData";

type BuilderHeroProps = {
  onCreateDraft: () => void;
  onStartHistoryTemplate: () => void;
};

export function BuilderHero({
  onCreateDraft,
  onStartHistoryTemplate,
}: BuilderHeroProps) {
  const HistoryIcon = historyTemplateAction.icon;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.6fr] lg:p-8">
        <div className="flex flex-col justify-center gap-4">
          <Badge variant="secondary" className="w-fit gap-2">
            <Workflow className="size-3.5" />
            Model-based custom tool design
          </Badge>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              Custom Tool Builder
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Design reusable desktop tools with inputs, blocks, safe test runs,
              optional Python code, and a publish flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onCreateDraft}>
              <PlusCircle className="size-4" />
              Create tool draft
            </Button>

            <Button variant="outline" onClick={onStartHistoryTemplate}>
              <HistoryIcon className="size-4" />
              {historyTemplateAction.label}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl bg-muted/50 p-4">
          {safetyCards.map((card) => (
            <div key={card.title} className="rounded-lg border bg-background p-4">
              <div className="mb-2 flex items-center gap-2">
                <card.icon className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">{card.title}</p>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}