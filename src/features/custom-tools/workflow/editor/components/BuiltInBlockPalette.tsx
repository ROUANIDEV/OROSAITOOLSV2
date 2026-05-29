import {
  Blocks,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  PlusCircle,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CustomToolBlockType } from "../../../domain/customToolTypes";
import { executableBlockTypeOptions } from "../../model/blockTypeOptions";
import { FoundationBlockCatalog } from "./FoundationBlockCatalog";

type BuiltInBlockPaletteProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onAddBlock: (type: CustomToolBlockType) => void;
  onStartDrag: (
    type: CustomToolBlockType,
    label: string,
    event: ReactPointerEvent,
  ) => void;
};

type BlockFilter =
  | "all"
  | "foundation"
  | "file"
  | "text"
  | "python"
  | "safety";

const filterOptions: { value: BlockFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "foundation", label: "Foundation" },
  { value: "file", label: "File" },
  { value: "text", label: "Text" },
  { value: "python", label: "Python" },
  { value: "safety", label: "Safety" },
];

function matchesExecutableFilter(type: string, filter: BlockFilter) {
  if (filter === "all") return true;
  if (filter === "foundation") return false;

  return type.startsWith(`${filter}.`);
}

export function BuiltInBlockPalette({
  collapsed,
  onCollapsedChange,
  onAddBlock,
  onStartDrag,
}: BuiltInBlockPaletteProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BlockFilter>("all");

  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return executableBlockTypeOptions.filter((option) => {
      const matchesQuery =
        option.label.toLowerCase().includes(normalizedQuery) ||
        option.description.toLowerCase().includes(normalizedQuery) ||
        option.value.toLowerCase().includes(normalizedQuery);

      return matchesQuery && matchesExecutableFilter(option.value, filter);
    });
  }, [filter, query]);

  const showExecutableBlocks = filter !== "foundation";
  const showFoundationBlocks = filter === "all" || filter === "foundation";

  if (collapsed) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="h-full w-12 flex-col gap-3 rounded-2xl border bg-card/80 px-2 py-4 text-xs text-muted-foreground shadow-sm"
        onClick={() => onCollapsedChange(false)}
        aria-label="Expand block palette"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
        <Blocks className="size-4" aria-hidden="true" />
        <span className="rotate-180 [writing-mode:vertical-rl]">Blocks</span>
      </Button>
    );
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col gap-4 overflow-hidden rounded-2xl border bg-card/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Blocks className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Block palette</h2>
          </div>

          <p className="text-xs text-muted-foreground">
            Drag executable blocks or foundation model blocks into the canvas.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onCollapsedChange(true)}
          aria-label="Collapse block palette"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search blocks..."
          className="pl-8"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const isActive = filter === option.value;

          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="xs"
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {showExecutableBlocks ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Executable blocks</h3>

              <Badge variant="outline" className="text-[10px]">
                current runtime
              </Badge>
            </div>

            {visibleOptions.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
                No executable blocks match your search.
              </div>
            ) : (
              <div className="space-y-2">
                {visibleOptions.map((option) => (
                  <article
                    key={option.value}
                    className="rounded-xl border bg-background/70 p-3 transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="mt-0.5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                        onPointerDown={(event) => {
                          onStartDrag(option.value, option.label, event);
                        }}
                        aria-label={`Drag ${option.label}`}
                      >
                        <GripVertical className="size-4" aria-hidden="true" />
                      </Button>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold leading-tight">
                            {option.label}
                          </h4>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0"
                            onClick={(event) => {
                              event.stopPropagation();
                              onAddBlock(option.value);
                            }}
                            aria-label={`Add ${option.label}`}
                          >
                            <PlusCircle className="size-4" aria-hidden="true" />
                          </Button>
                        </div>

                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {option.description}
                        </p>

                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          {option.value}
                        </Badge>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {showFoundationBlocks ? (
          <FoundationBlockCatalog
            query={query}
            onAddBlock={onAddBlock}
            onStartDrag={onStartDrag}
          />
        ) : null}
      </div>
    </aside>
  );
}