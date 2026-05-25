import { Badge } from "@/components/ui/badge";
import type { TestRunExecutionPlanItem } from "./testRunTypes";

type TestRunExecutionPlanProps = {
  plan: TestRunExecutionPlanItem[];
};

export function TestRunExecutionPlan({ plan }: TestRunExecutionPlanProps) {
  if (plan.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">Execution plan</h4>
        <p className="text-xs text-muted-foreground">
          This is the exact block order the runner will use.
        </p>
      </div>

      <ol className="space-y-2">
        {plan.map((item) => (
          <li
            key={`${item.stepIndex}-${item.blockId}`}
            className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold">
              {item.stepIndex}
            </span>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {item.blockLabel}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{item.blockType}</Badge>
                <span className="truncate text-xs text-muted-foreground">
                  {item.blockId}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}