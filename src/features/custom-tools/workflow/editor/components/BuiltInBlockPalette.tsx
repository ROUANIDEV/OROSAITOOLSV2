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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { CustomToolBlockType } from "../../../domain/customToolTypes";

import { blockTypeOptions } from "../../model/blockTypeOptions";

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

type BlockFilter = "all" | "file" | "text" | "python" | "safety";

const filterOptions: { value: BlockFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "file", label: "File" },
  { value: "text", label: "Text" },
  { value: "python", label: "Python" },
  { value: "safety", label: "Safety" },
];

function matchesFilter(type: string, filter: BlockFilter) {
  if (filter === "all") return true;

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

    return blockTypeOptions.filter((option) => {
      const matchesQuery =
        option.label.toLowerCase().includes(normalizedQuery) ||
        option.description.toLowerCase().includes(normalizedQuery) ||
        option.value.toLowerCase().includes(normalizedQuery);

      return matchesQuery && matchesFilter(option.value, filter);
    });
  }, [filter, query]);

  if (collapsed) {
    return (
      <aside className="flex min-h-176 flex-col items-center gap-3 rounded-[1.75rem] border bg-background/80 p-3 shadow-sm">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => onCollapsedChange(false)}
          aria-label="Expand built-in blocks"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="flex flex-1 items-center">
          <p className="-rotate-90 whitespace-nowrap text-xs font-medium text-muted-foreground">
            Built-in blocks
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex min-h-176 flex-col rounded-[1.75rem] border bg-background/80 p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Blocks className="h-4 w-4" />

            <h3 className="text-sm font-semibold">Built-in blocks</h3>
          </div>

          <p className="text-xs text-muted-foreground">
            Drag cards anywhere into the canvas.
          </p>
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onCollapsedChange(true)}
          aria-label="Collapse built-in blocks"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <label className="relative mb-3 block">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

        <Input
          className="pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search blocks..."
        />
      </label>

      <div className="mb-4 flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={filter === option.value ? "default" : "outline"}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {visibleOptions.map((option) => (
          <div
            key={option.value}
            className="group cursor-grab rounded-2xl border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
            onPointerDown={(event) =>
              onStartDrag(
                option.value as CustomToolBlockType,
                option.label,
                event,
              )
            }
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-lg border bg-muted p-1.5 text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{option.label}</p>

                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onAddBlock(option.value as CustomToolBlockType)}
                aria-label={`Add ${option.label}`}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {visibleOptions.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            No blocks match your search.
          </p>
        ) : null}
      </div>
    </aside>
  );
}