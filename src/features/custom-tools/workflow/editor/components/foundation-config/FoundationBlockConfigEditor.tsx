import { Badge } from "@/components/ui/badge";
import type {
  CustomToolBlock,
  CustomToolFoundationBlockType,
} from "../../../../domain/customToolTypes";
import {
  getFoundationBlockDefinition,
  getFoundationCanvasNodePresentation,
  type FoundationBlockDefinition,
} from "../../../foundation";
import { FoundationBlockCodePreview } from "./FoundationBlockCodePreview";
import { FoundationBlockDiagnostics } from "./FoundationBlockDiagnostics";
import { FoundationCollectionBlockEditor } from "./FoundationCollectionBlockEditor";
import { FoundationControlFlowBlockEditor } from "./FoundationControlFlowBlockEditor";
import { FoundationDataBlockEditor } from "./FoundationDataBlockEditor";
import { FoundationFunctionBlockEditor } from "./FoundationFunctionBlockEditor";
import type { FoundationConfigEditorProps } from "./FoundationConfigFields";

function FoundationPortSummary({
  definition,
}: {
  definition: FoundationBlockDefinition;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border bg-background/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Inputs
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {definition.inputs.length === 0 ? (
            <span className="text-xs text-muted-foreground">No inputs</span>
          ) : (
            definition.inputs.map((port) => (
              <Badge key={port.id} variant="outline" className="text-[10px]">
                {port.label}
                {port.dataType ? ` · ${port.dataType}` : ""}
              </Badge>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-background/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Outputs
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {definition.outputs.length === 0 ? (
            <span className="text-xs text-muted-foreground">No outputs</span>
          ) : (
            definition.outputs.map((port) => (
              <Badge key={port.id} variant="outline" className="text-[10px]">
                {port.label}
                {port.dataType ? ` · ${port.dataType}` : ""}
              </Badge>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FoundationCanvasIdentityPreview({
  blockId,
  blockType,
  config,
}: FoundationConfigEditorProps & {
  blockType: CustomToolFoundationBlockType;
}) {
  const definition = getFoundationBlockDefinition(blockType);
  const previewBlock: CustomToolBlock = {
    id: blockId,
    type: blockType,
    label: definition.defaultLabel,
    description: definition.summary,
    executionMode: "model",
    config,
  };
  const presentation = getFoundationCanvasNodePresentation(previewBlock);

  return (
    <div
      className={[
        "rounded-xl border p-4",
        presentation.shellClassName,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex h-10 min-w-12 shrink-0 items-center justify-center rounded-xl px-2 text-[10px] font-black tracking-tight shadow-sm",
            presentation.iconClassName,
          ].join(" ")}
          aria-hidden="true"
        >
          {presentation.iconLabel}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={[
                "border-transparent text-[10px]",
                presentation.badgeClassName,
              ].join(" ")}
            >
              canvas identity
            </Badge>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              updates live from config
            </span>
          </div>

          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {presentation.eyebrow}
            </p>
            <h3 className="truncate text-lg font-bold leading-tight">
              {presentation.primaryText}
            </h3>
            <p className="truncate text-sm font-semibold text-muted-foreground">
              {presentation.secondaryText}
            </p>
          </div>

          <p className="line-clamp-2 text-xs text-muted-foreground">
            {presentation.detailText}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {presentation.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderCategoryEditor(
  blockType: CustomToolFoundationBlockType,
  props: FoundationConfigEditorProps,
) {
  const definition = getFoundationBlockDefinition(blockType);

  switch (definition.category) {
    case "data":
      return <FoundationDataBlockEditor {...props} blockType={blockType} />;

    case "scope":
    case "function":
      return <FoundationFunctionBlockEditor {...props} blockType={blockType} />;

    case "control-flow":
      return (
        <FoundationControlFlowBlockEditor {...props} blockType={blockType} />
      );

    case "collection":
      return (
        <FoundationCollectionBlockEditor {...props} blockType={blockType} />
      );

    default:
      return null;
  }
}

export function FoundationBlockConfigEditor({
  blockId,
  blockType,
  config,
  onConfigChange,
}: FoundationConfigEditorProps & {
  blockType: CustomToolFoundationBlockType;
}) {
  const definition = getFoundationBlockDefinition(blockType);

  return (
    <div className="space-y-5">
      <div
        className={[
          "rounded-xl border p-4",
          definition.visual.surfaceClassName,
          definition.visual.borderClassName,
        ].join(" ")}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{definition.title}</h3>
              <Badge
                variant="outline"
                className={[
                  "border-transparent text-[10px]",
                  definition.visual.badgeClassName,
                ].join(" ")}
              >
                {definition.category}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                model-only
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              {definition.description}
            </p>
          </div>

          <code className="rounded-md bg-background/80 px-2 py-1 text-[10px] text-muted-foreground">
            {definition.kind}
          </code>
        </div>
      </div>

      <FoundationCanvasIdentityPreview
        blockId={blockId}
        blockType={blockType}
        config={config}
        onConfigChange={onConfigChange}
      />

      <FoundationPortSummary definition={definition} />

      <FoundationBlockCodePreview
        blockId={blockId}
        blockType={blockType}
        config={config}
        onConfigChange={onConfigChange}
      />

      <div className="rounded-xl border bg-card/50 p-4">
        {renderCategoryEditor(blockType, {
          blockId,
          config,
          onConfigChange,
        })}
      </div>

      <FoundationBlockDiagnostics
        blockId={blockId}
        blockType={blockType}
        config={config}
      />
    </div>
  );
}
