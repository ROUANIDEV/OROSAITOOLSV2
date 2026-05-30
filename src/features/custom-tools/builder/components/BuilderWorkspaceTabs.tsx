import { Button } from "@/components/ui/button";

export type BuilderWorkspaceStage =
  | "overview"
  | "inputs"
  | "canvas"
  | "safety"
  | "test"
  | "publish";

type BuilderWorkspaceTabsProps = {
  activeStage: BuilderWorkspaceStage;
  onStageChange: (stage: BuilderWorkspaceStage) => void;
};

const stages: { id: BuilderWorkspaceStage; label: string; helper: string }[] = [
  { id: "overview", label: "Overview", helper: "Name and summary" },
  { id: "canvas", label: "Canvas", helper: "Blocks, inputs, outputs" },
  { id: "safety", label: "Safety", helper: "Permissions and checks" },
  { id: "test", label: "Test", helper: "Rust workflow + dry run" },
  { id: "publish", label: "Publish", helper: "Manage tools" },
];

export function BuilderWorkspaceTabs({
  activeStage,
  onStageChange,
}: BuilderWorkspaceTabsProps) {
  const normalizedActiveStage = activeStage === "inputs" ? "canvas" : activeStage;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stages.map((stage) => {
        const isActive = normalizedActiveStage === stage.id;
        return (
          <Button
            key={stage.id}
            type="button"
            variant={isActive ? "default" : "outline"}
            className="h-auto justify-start rounded-2xl px-5 py-4 text-left"
            onClick={() => onStageChange(stage.id)}
          >
            <span className="flex flex-col items-start gap-1">
              <span className="text-sm font-semibold">{stage.label}</span>
              <span className="text-xs opacity-70">{stage.helper}</span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}
