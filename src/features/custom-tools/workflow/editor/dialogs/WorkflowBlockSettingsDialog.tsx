import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CustomToolBlock } from "../../../domain/customToolTypes";
import type { FoundationArrowInputSuggestion } from "../../../runtime/foundationWorkflowRuntime";
import { countActionableDiagnostics } from "../../diagnostics/workflowBlockDiagnostics";
import type { WorkflowConnection } from "../../graph/workflowConnections";
import {
  getBlockPorts,
  type WorkflowInputPort,
  type WorkflowOutputPort,
} from "../../model/workflowBlockPorts";
import { CustomToolBlockRow } from "../components/CustomToolBlockRow";

type WorkflowBlockSettingsDialogProps = {
  block: CustomToolBlock | null;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  workflowBlocks?: CustomToolBlock[];
  workflowConnections?: WorkflowConnection[];
  linkedInputSuggestions?: FoundationArrowInputSuggestion[];
  onClose: () => void;
  onChange: (block: CustomToolBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onApplyLinkedInput?: (connectionId: string) => void;
  onRemoveLinkedInput?: (connectionId: string) => void;
};

function getBlockLabel(blocks: CustomToolBlock[], blockId: string) {
  return blocks.find((item) => item.id === blockId)?.label ?? blockId;
}

function getOutputPortLabel(
  blocks: CustomToolBlock[],
  blockId: string,
  portId?: string,
) {
  const block = blocks.find((item) => item.id === blockId);
  if (!block) return portId ?? "output";
  return (
    getBlockPorts(block).outputs.find((port) => port.id === portId)?.label ??
    portId ??
    "output"
  );
}

function getInputPortLabel(
  blocks: CustomToolBlock[],
  blockId: string,
  portId?: string,
) {
  const block = blocks.find((item) => item.id === blockId);
  if (!block) return portId ?? "input";
  return (
    getBlockPorts(block).inputs.find((port) => port.id === portId)?.label ??
    portId ??
    "input"
  );
}

function PortBadge({ children, tone }: { children: string; tone: "input" | "output" }) {
  return (
    <span
      className={[
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tone === "input"
          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function ConnectionLine({
  label,
  blockLabel,
  portLabel,
}: {
  label: string;
  blockLabel: string;
  portLabel: string;
}) {
  return (
    <div className="mt-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
      <span className="font-semibold">{label}</span>
      <span className="ml-1">{blockLabel}</span>
      <span className="mx-1 text-muted-foreground">→</span>
      <span>{portLabel}</span>
    </div>
  );
}

function InputPortCard({
  port,
  blocks,
  connections,
  blockId,
}: {
  port: WorkflowInputPort;
  blocks: CustomToolBlock[];
  connections: WorkflowConnection[];
  blockId: string;
}) {
  const connection = connections.find((item) => {
    return item.toBlockId === blockId && (item.toPortId ?? "input") === port.id;
  });

  return (
    <article className="rounded-2xl border bg-background/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{port.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {port.description || "This input accepts one compatible arrow."}
          </p>
        </div>
        <PortBadge tone="input">input</PortBadge>
      </div>

      {connection ? (
        <ConnectionLine
          label="Connected from"
          blockLabel={getBlockLabel(blocks, connection.fromBlockId)}
          portLabel={getOutputPortLabel(blocks, connection.fromBlockId, connection.fromPortId)}
        />
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
        <code className="rounded-md bg-muted px-2 py-1">{port.id}</code>
        <span className="rounded-md bg-muted px-2 py-1">{port.dataType || "any"}</span>
      </div>
    </article>
  );
}

function OutputPortCard({
  port,
  blocks,
  connections,
  blockId,
}: {
  port: WorkflowOutputPort;
  blocks: CustomToolBlock[];
  connections: WorkflowConnection[];
  blockId: string;
}) {
  const connection = connections.find((item) => {
    return item.fromBlockId === blockId && (item.fromPortId ?? "output") === port.id;
  });

  return (
    <article className="rounded-2xl border bg-background/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{port.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {port.description || "This output produces one value or control arrow."}
          </p>
        </div>
        <PortBadge tone="output">output</PortBadge>
      </div>

      {connection ? (
        <ConnectionLine
          label="Connected to"
          blockLabel={getBlockLabel(blocks, connection.toBlockId)}
          portLabel={getInputPortLabel(blocks, connection.toBlockId, connection.toPortId)}
        />
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
        <code className="rounded-md bg-muted px-2 py-1">{port.id}</code>
        <span className="rounded-md bg-muted px-2 py-1">{port.dataType || "any"}</span>
      </div>
    </article>
  );
}


function SetupIssuePanel({
  block,
  connections,
}: {
  block: CustomToolBlock;
  connections: WorkflowConnection[];
}) {
  const summary = countActionableDiagnostics(block, connections);
  if (summary.total === 0) {
    return (
      <section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
        <div className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]" />
          This block is ready
        </div>
        <p className="mt-1 text-xs opacity-85">
          No setup problem is active. Connected ports are counted as configured values.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-amber-500/30 bg-linear-to-br from-amber-500/15 via-background to-background p-4 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Setup needs attention</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Only real unfinished fields are shown here. Values supplied by arrows are not reported as errors.
          </p>
        </div>
        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
          {summary.errors > 0
            ? `${summary.errors} fix${summary.errors === 1 ? "" : "es"}`
            : summary.warnings > 0
              ? `${summary.warnings} check${summary.warnings === 1 ? "" : "s"}`
              : `${summary.infos} note${summary.infos === 1 ? "" : "s"}`}
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {summary.diagnostics.map((diagnostic, issueIndex) => (
          <article
            key={`${diagnostic.id ?? diagnostic.message}-${issueIndex}`}
            className="rounded-2xl border bg-background/75 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  diagnostic.severity === "error"
                    ? "bg-destructive/15 text-destructive"
                    : diagnostic.severity === "warning"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {diagnostic.severity ?? "info"}
              </span>
              {diagnostic.field ? (
                <code className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {diagnostic.field}
                </code>
              ) : null}
            </div>
            <p className="mt-2 text-sm font-semibold">{diagnostic.title ?? diagnostic.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">{diagnostic.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PortConnectionSummary({
  block,
  blocks,
  connections,
}: {
  block: CustomToolBlock;
  blocks: CustomToolBlock[];
  connections: WorkflowConnection[];
}) {
  const ports = getBlockPorts(block);

  return (
    <section className="rounded-3xl border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Block ports</h3>
          <p className="text-xs text-muted-foreground">
            Connected ports show exactly where the arrow goes. Free ports show only their own info.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          setup view
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Inputs
          </p>
          {ports.inputs.length > 0 ? (
            ports.inputs.map((port) => (
              <InputPortCard
                key={port.id}
                port={port}
                blocks={blocks}
                connections={connections}
                blockId={block.id}
              />
            ))
          ) : (
            <p className="rounded-2xl border bg-background/70 p-3 text-xs text-muted-foreground">
              This block has no input ports.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Outputs
          </p>
          {ports.outputs.length > 0 ? (
            ports.outputs.map((port) => (
              <OutputPortCard
                key={port.id}
                port={port}
                blocks={blocks}
                connections={connections}
                blockId={block.id}
              />
            ))
          ) : (
            <p className="rounded-2xl border bg-background/70 p-3 text-xs text-muted-foreground">
              This block has no output ports.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function WorkflowBlockSettingsDialog({
  block,
  index,
  canMoveUp,
  canMoveDown,
  workflowBlocks = [],
  workflowConnections = [],
  linkedInputSuggestions = [],
  onClose,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: WorkflowBlockSettingsDialogProps) {
  return (
    <Dialog
      open={Boolean(block)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{block ? `${block.label} setup` : "Block setup"}</DialogTitle>
          <DialogDescription>
            Configure the block and review each port connection.
          </DialogDescription>
        </DialogHeader>

        {block ? (
          <div className="space-y-4">
            <SetupIssuePanel
              block={block}
              connections={workflowConnections}
            />

            <CustomToolBlockRow
              block={block}
              index={index}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              workflowBlocks={workflowBlocks}
              linkedInputSuggestions={linkedInputSuggestions}
              onChange={onChange}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onRemove={onRemove}
            />

            <PortConnectionSummary
              block={block}
              blocks={workflowBlocks}
              connections={workflowConnections}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
