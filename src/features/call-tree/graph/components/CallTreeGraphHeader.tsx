import { Minus, Plus, RotateCcw, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CHILD_OPTIONS, DEPTH_OPTIONS } from "../model";

type CallTreeGraphHeaderProps = {
  truncated: boolean;
  searchTerm: string;
  maxDepth: number;
  maxChildren: number;
  onSearchTermChange: (value: string) => void;
  onMaxDepthChange: (value: number) => void;
  onMaxChildrenChange: (value: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
};

export function CallTreeGraphHeader({
  truncated,
  searchTerm,
  maxDepth,
  maxChildren,
  onSearchTermChange,
  onMaxDepthChange,
  onMaxChildrenChange,
  onZoomIn,
  onZoomOut,
  onResetView,
}: CallTreeGraphHeaderProps) {
  return (
    <CardHeader className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Interactive</Badge>
            <Badge variant="outline">Branched graph</Badge>
            {truncated && (
              <Badge variant="destructive">Large graph trimmed</Badge>
            )}
          </div>

          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-5" />
            Call Tree Graph
          </CardTitle>

          <CardDescription>
            Pan the canvas, zoom in/out, search functions, and click nodes to
            inspect branches.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onZoomIn}>
            <Plus className="size-4" />
            Zoom in
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={onZoomOut}>
            <Minus className="size-4" />
            Zoom out
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetView}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search function name, file, or line..."
            className="pl-9"
          />
        </div>

        <GraphOptionGroup
          label="Depth"
          options={DEPTH_OPTIONS}
          value={maxDepth}
          onChange={onMaxDepthChange}
        />

        <GraphOptionGroup
          label="Children"
          options={CHILD_OPTIONS}
          value={maxChildren}
          onChange={onMaxChildrenChange}
        />
      </div>
    </CardHeader>
  );
}

function GraphOptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: number[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          variant={value === option ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}