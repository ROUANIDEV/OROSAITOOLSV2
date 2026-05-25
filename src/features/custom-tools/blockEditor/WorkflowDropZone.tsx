type WorkflowDropZoneProps = {
  index: number;
  isDragging: boolean;
};

export function WorkflowDropZone({ index, isDragging }: WorkflowDropZoneProps) {
  return (
    <div
      data-workflow-drop-index={index}
      className={`py-3 transition ${isDragging ? "opacity-100" : "opacity-40"}`}
    >
      <div
        className={`flex min-h-12 items-center justify-center rounded-2xl border border-dashed px-4 text-xs transition ${
          isDragging
            ? "border-primary bg-primary/10 text-primary"
            : "border-muted-foreground/20 bg-muted/20 text-muted-foreground"
        }`}
      >
        Drop here
      </div>
    </div>
  );
}