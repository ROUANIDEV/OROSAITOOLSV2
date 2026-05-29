import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import type { CustomToolFoundationBlockType } from "../../../../domain/customToolTypes";
import {
  validateFoundationBlockConfig,
  type FoundationBlockDiagnostic,
  type FoundationDiagnosticSeverity,
} from "../../../foundation";

const severityConfig = {
  error: {
    label: "Error",
    icon: AlertCircle,
    className:
      "border-destructive/40 bg-destructive/10 text-destructive dark:text-destructive-foreground",
    badgeClassName: "bg-destructive/15 text-destructive border-transparent",
  },
  warning: {
    label: "Warning",
    icon: TriangleAlert,
    className:
      "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    badgeClassName:
      "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-transparent",
  },
  info: {
    label: "Info",
    icon: Info,
    className:
      "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200",
    badgeClassName:
      "bg-sky-500/15 text-sky-800 dark:text-sky-200 border-transparent",
  },
} satisfies Record<
  FoundationDiagnosticSeverity,
  {
    label: string;
    icon: LucideIcon;
    className: string;
    badgeClassName: string;
  }
>;

type FoundationBlockDiagnosticsProps = {
  blockId: string;
  blockType: CustomToolFoundationBlockType;
  config: Record<string, unknown>;
};

type LegacyValidationResult = {
  diagnostics?: FoundationBlockDiagnostic[];
  issues?: FoundationBlockDiagnostic[];
};

function createEmptyDiagnosticGroups(): Record<
  FoundationDiagnosticSeverity,
  FoundationBlockDiagnostic[]
> {
  return {
    error: [],
    warning: [],
    info: [],
  };
}

function isDiagnosticArray(value: unknown): value is FoundationBlockDiagnostic[] {
  return Array.isArray(value);
}

function normalizeDiagnostics(value: unknown): FoundationBlockDiagnostic[] {
  if (isDiagnosticArray(value)) return value;

  if (!value || typeof value !== "object") return [];

  const result = value as LegacyValidationResult;

  if (isDiagnosticArray(result.diagnostics)) return result.diagnostics;
  if (isDiagnosticArray(result.issues)) return result.issues;

  return [];
}

function groupDiagnosticsBySeverity(
  diagnosticsInput: unknown,
): Record<FoundationDiagnosticSeverity, FoundationBlockDiagnostic[]> {
  const diagnostics = normalizeDiagnostics(diagnosticsInput);

  return diagnostics.reduce<Record<FoundationDiagnosticSeverity, FoundationBlockDiagnostic[]>>(
    (groups, diagnostic) => {
      groups[diagnostic.severity].push(diagnostic);
      return groups;
    },
    createEmptyDiagnosticGroups(),
  );
}

function DiagnosticRow({
  diagnostic,
}: {
  diagnostic: FoundationBlockDiagnostic;
}) {
  const config = severityConfig[diagnostic.severity];
  const Icon = config.icon;

  return (
    <li className={["rounded-lg border p-3", config.className].join(" ")}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={["text-[10px]", config.badgeClassName].join(" ")}
            >
              {config.label}
            </Badge>

            {diagnostic.field ? (
              <code className="rounded bg-background/70 px-1.5 py-0.5 text-[10px]">
                {diagnostic.field}
              </code>
            ) : null}
          </div>

          <p className="text-xs font-medium">
            {diagnostic.title || diagnostic.message}
          </p>

          {diagnostic.message && diagnostic.message !== diagnostic.title ? (
            <p className="text-xs opacity-85">{diagnostic.message}</p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function FoundationBlockDiagnostics({
  blockId,
  blockType,
  config,
}: FoundationBlockDiagnosticsProps) {
  const diagnostics = useMemo(
    () =>
      normalizeDiagnostics(
        validateFoundationBlockConfig({
          blockId,
          blockType,
          config,
        }),
      ),
    [blockId, blockType, config],
  );

  const groups = useMemo(
    () => groupDiagnosticsBySeverity(diagnostics),
    [diagnostics],
  );

  if (diagnostics.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          <p className="text-xs font-medium">
            Foundation config looks valid for the current model step.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">Foundation diagnostics</h4>
          <p className="text-xs text-muted-foreground">
            These checks protect the model before Rust/runtime execution is wired.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {groups.error.length ? (
            <Badge variant="destructive" className="text-[10px]">
              {groups.error.length} errors
            </Badge>
          ) : null}

          {groups.warning.length ? (
            <Badge
              variant="outline"
              className="border-amber-500/40 text-[10px] text-amber-700 dark:text-amber-300"
            >
              {groups.warning.length} warnings
            </Badge>
          ) : null}

          {groups.info.length ? (
            <Badge variant="secondary" className="text-[10px]">
              {groups.info.length} info
            </Badge>
          ) : null}
        </div>
      </div>

      <ul className="space-y-2">
        {diagnostics.map((diagnostic, index) => (
          <DiagnosticRow
            key={diagnostic.id || `${diagnostic.severity}-${index}`}
            diagnostic={diagnostic}
          />
        ))}
      </ul>
    </div>
  );
}
