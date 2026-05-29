import { Code2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";
import { getFoundationBlockCodePreview } from "../../../foundation";
import type { FoundationConfigEditorProps } from "./FoundationConfigFields";

type FoundationBlockCodePreviewProps = FoundationConfigEditorProps & {
  blockType: CustomToolFoundationBlockType;
};

type LegacyCodePreviewShape = {
  title?: unknown;
  description?: unknown;
  languageLabel?: unknown;
  lines?: unknown;
  notes?: unknown;
};

type NormalizedCodePreview = {
  title: string;
  description: string;
  languageLabel: string;
  lines: string[];
  notes: string[];
};

function previewSafeLabel(blockType: CustomToolFoundationBlockType) {
  return blockType.split(".").join(" ");
}

function normalizeLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((line) => String(line));
  }

  if (typeof value === "string") {
    const lines = value.split("\n");
    return lines.length > 0 ? lines : [value];
  }

  if (value === null || value === undefined) {
    return ["// No preview generated for this block yet."];
  }

  return [String(value)];
}

function normalizeNotes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((note) => String(note)).filter((note) => note.trim().length > 0);
}

function normalizePreview(
  rawPreview: unknown,
  blockType: CustomToolFoundationBlockType,
): NormalizedCodePreview {
  const fallbackTitle = previewSafeLabel(blockType);

  if (typeof rawPreview === "string") {
    return {
      title: fallbackTitle,
      description: "Rust-like compiler preview generated from the current foundation config.",
      languageLabel: "rust preview",
      lines: normalizeLines(rawPreview),
      notes: [],
    };
  }

  if (rawPreview && typeof rawPreview === "object") {
    const preview = rawPreview as LegacyCodePreviewShape;

    return {
      title: typeof preview.title === "string" ? preview.title : fallbackTitle,
      description:
        typeof preview.description === "string"
          ? preview.description
          : "Rust-like compiler preview generated from the current foundation config.",
      languageLabel:
        typeof preview.languageLabel === "string"
          ? preview.languageLabel
          : "rust preview",
      lines: normalizeLines(preview.lines),
      notes: normalizeNotes(preview.notes),
    };
  }

  return {
    title: fallbackTitle,
    description: "Rust-like compiler preview generated from the current foundation config.",
    languageLabel: "rust preview",
    lines: ["// No preview generated for this block yet."],
    notes: [],
  };
}

export function FoundationBlockCodePreview({
  blockType,
  config,
}: FoundationBlockCodePreviewProps) {
  const rawPreview = getFoundationBlockCodePreview(blockType, config);
  const preview = normalizePreview(rawPreview, blockType);

  return (
    <div className="overflow-hidden rounded-xl border bg-card/50">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
            <Code2 className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{preview.title}</h3>
              <Badge variant="outline" className="text-[10px]">
                compiler draft
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              {preview.description}
            </p>
          </div>
        </div>

        <Badge variant="secondary" className="text-[10px]">
          {preview.languageLabel}
        </Badge>
      </div>

      <pre className="max-h-72 overflow-auto bg-background/70 px-4 py-3 text-xs leading-relaxed">
        <code>
          {preview.lines.map((line, index) => (
            <span key={`${index}-${line}`} className="block">
              <span className="mr-3 select-none text-muted-foreground/60">
                {String(index + 1).padStart(2, "0")}
              </span>
              {line || " "}
            </span>
          ))}
        </code>
      </pre>

      {preview.notes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t bg-muted/20 px-4 py-3">
          {preview.notes.map((note) => (
            <span
              key={note}
              className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {note}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
