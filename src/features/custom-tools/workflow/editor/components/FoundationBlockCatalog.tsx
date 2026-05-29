import {
  Blocks,
  GripVertical,
  PlusCircle,
} from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  foundationBlockGroups,
  type FoundationBlockCategory,
  type FoundationBlockDefinition,
  type FoundationBlockKind,
} from "../../foundation";

type FoundationBlockCatalogProps = {
  query?: string;
  onAddBlock: (type: FoundationBlockKind) => void;
  onStartDrag: (
    type: FoundationBlockKind,
    label: string,
    event: ReactPointerEvent,
  ) => void;
};

const categoryLabels = {
  data: "Data",
  scope: "Scope",
  function: "Functions",
  "control-flow": "Control flow",
  collection: "Collections",
} satisfies Record<FoundationBlockCategory, string>;

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function matchesFoundationQuery(
  block: FoundationBlockDefinition,
  normalizedQuery: string,
) {
  if (!normalizedQuery) return true;

  return [
    block.kind,
    block.title,
    block.summary,
    block.description,
    block.category,
    ...block.tags,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function getVisibleFoundationGroups(query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  return foundationBlockGroups
    .map((group) => ({
      ...group,
      blocks: group.blocks.filter((block) =>
        matchesFoundationQuery(block, normalizedQuery),
      ),
    }))
    .filter((group) => group.blocks.length > 0);
}

function FoundationBlockCard({
  block,
  onAddBlock,
  onStartDrag,
}: {
  block: FoundationBlockDefinition;
  onAddBlock: (type: FoundationBlockKind) => void;
  onStartDrag: (
    type: FoundationBlockKind,
    label: string,
    event: ReactPointerEvent,
  ) => void;
}) {
  return (
    <article
      className={[
        "group rounded-xl border p-3 transition",
        "hover:-translate-y-0.5 hover:shadow-sm",
        block.visual.surfaceClassName,
        block.visual.borderClassName,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={[
            "mt-0.5 shrink-0 cursor-grab text-muted-foreground",
            "active:cursor-grabbing",
          ].join(" ")}
          onPointerDown={(event) => {
            onStartDrag(block.kind, block.title, event);
          }}
          aria-label={`Drag ${block.title}`}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </Button>

        <div
          className={[
            "flex size-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
            block.visual.accentClassName,
          ].join(" ")}
        >
          <Blocks className="size-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-semibold leading-tight">
                {block.title}
              </h4>

              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {block.summary}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={(event) => {
                event.stopPropagation();
                onAddBlock(block.kind);
              }}
              aria-label={`Add ${block.title}`}
            >
              <PlusCircle className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
            <Badge
              variant="outline"
              className={[
                "border-transparent text-[10px]",
                block.visual.badgeClassName,
              ].join(" ")}
            >
              model
            </Badge>

            <span className="rounded-full bg-background/70 px-2 py-0.5">
              {block.inputs.length} inputs
            </span>

            <span className="rounded-full bg-background/70 px-2 py-0.5">
              {block.outputs.length} outputs
            </span>

            <span className="rounded-full bg-background/70 px-2 py-0.5">
              {block.kind}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FoundationBlockCatalog({
  query = "",
  onAddBlock,
  onStartDrag,
}: FoundationBlockCatalogProps) {
  const visibleGroups = getVisibleFoundationGroups(query);

  return (
    <section className="space-y-3 border-t pt-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Foundation blocks</h3>

          <Badge variant="secondary" className="text-[10px]">
            draggable model
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Generic programming blocks for designing custom tools. These blocks can
          now live on the canvas, but runtime execution will be wired in a later
          step.
        </p>
      </div>

      {visibleGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
          No foundation blocks match your search.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map((group) => (
            <div key={group.category} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {categoryLabels[group.category]}
                </h4>

                <span className="text-[10px] text-muted-foreground">
                  {group.blocks.length}
                </span>
              </div>

              <div className="space-y-2">
                {group.blocks.map((block) => (
                  <FoundationBlockCard
                    key={block.kind}
                    block={block}
                    onAddBlock={onAddBlock}
                    onStartDrag={onStartDrag}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}