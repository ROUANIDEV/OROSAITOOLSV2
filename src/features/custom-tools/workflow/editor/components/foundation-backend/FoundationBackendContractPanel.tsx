import {
  CheckCircle2,
  Clipboard,
  Code2,
  FileJson2,
  ServerCog,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomToolBlockType } from "../../../../domain/customToolTypes";
import { createFoundationBackendContract } from "../../../foundation";
import { FoundationBackendRunPanel } from "./FoundationBackendRunPanel";

type FoundationBackendContractPanelProps = {
  blockId: string;
  blockType: CustomToolBlockType;
  config: Record<string, unknown>;
};

function statusLabel(status: string) {
  switch (status) {
    case "ready-for-rust-handler":
      return "ready for Rust";
    case "needs-config":
      return "needs config";
    default:
      return "model only";
  }
}

function statusClassName(status: string) {
  switch (status) {
    case "ready-for-rust-handler":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "needs-config":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300";
  }
}

function SmallList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-background/60 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 min-h-5 text-xs text-foreground">
        {items.length > 0 ? items.join(", ") : "—"}
      </p>
    </div>
  );
}

export function FoundationBackendContractPanel({
  blockId,
  blockType,
  config,
}: FoundationBackendContractPanelProps) {
  const [copied, setCopied] = useState(false);
  const contract = useMemo(
    () => createFoundationBackendContract(blockType, config),
    [blockType, config],
  );

  if (!contract) return null;

  const payload = {
    blockId,
    ...contract,
  };

  const json = JSON.stringify(payload, null, 2);

  const copyContract = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border bg-card/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ServerCog className="size-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-sm font-semibold">Backend handoff contract</h3>
            </div>

            <p className="text-xs text-muted-foreground">
              Normalized instruction for Rust. The live preview below now sends
              this block config to the backend engine in dry-run mode.
            </p>
          </div>

          <Badge
            variant="outline"
            className={["shrink-0", statusClassName(contract.status)].join(" ")}
          >
            {statusLabel(contract.status)}
          </Badge>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-xl border bg-background/70 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Code2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Rust handler
            </div>
            <code className="mt-2 block break-all rounded-md bg-muted px-2 py-1.5 text-[11px]">
              {contract.rustHandler}
            </code>
          </div>

          <div className="rounded-xl border bg-background/70 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <FileJson2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Instruction
            </div>
            <code className="mt-2 block rounded-md bg-muted px-2 py-1.5 text-[11px]">
              {contract.instruction.op}
            </code>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <SmallList title="Reads" items={contract.reads} />
          <SmallList title="Writes" items={contract.writes} />
          <SmallList title="Produces" items={contract.produces} />
        </div>

        <div className="rounded-xl border bg-background/70 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pseudo code
          </p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-xs">
            {contract.pseudoCode}
          </pre>
        </div>

        {contract.diagnostics.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              Fix before backend execution
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-amber-700 dark:text-amber-300">
              {contract.diagnostics.map((diagnostic) => (
                <li key={diagnostic}>{diagnostic}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            This block has enough UI data to call the Rust preview command.
          </div>
        )}

        <details className="rounded-xl border bg-background/70 p-3">
          <summary className="cursor-pointer text-xs font-semibold">
            Backend JSON payload
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-muted p-3 text-[11px]">
            {json}
          </pre>
        </details>

        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={copyContract}>
            <Clipboard className="mr-2 size-3.5" aria-hidden="true" />
            {copied ? "Copied" : "Copy contract"}
          </Button>
        </div>
      </section>

      <FoundationBackendRunPanel
        blockId={blockId}
        blockType={blockType}
        config={config}
      />
    </div>
  );
}
