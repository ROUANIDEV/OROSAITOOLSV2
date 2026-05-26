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
  { id: "inputs", label: "Inputs", helper: "User fields" },
  { id: "canvas", label: "Canvas", helper: "Blocks and flow" },
  { id: "safety", label: "Safety", helper: "Permissions and checks" },
  { id: "test", label: "Test", helper: "Dry-run workflow" },
  { id: "publish", label: "Publish", helper: "Manage tools" },
];

export function BuilderWorkspaceTabs({
  activeStage,
  onStageChange,
}: BuilderWorkspaceTabsProps) {
  return (
    <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
      {stages.map((stage) => {
        const isActive = activeStage === stage.id;

        return (
          <Button
            key={stage.id}
            type="button"
            variant={isActive ? "default" : "outline"}
            className="h-auto justify-start px-4 py-3 text-left"
            onClick={() => onStageChange(stage.id)}
          >
            <span className="space-y-1">
              <span className="block text-sm font-medium">{stage.label}</span>
              <span className="block text-xs opacity-80">{stage.helper}</span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}