import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { CustomToolManifest } from "../../domain/customToolTypes";

type ToolDraftSummaryProps = {
  draft: CustomToolManifest;
};

export function ToolDraftSummary({ draft }: ToolDraftSummaryProps) {
  const enabledPermissions = Object.entries(draft.permissions)
    .filter(([, enabled]) => enabled)
    .map(([permission]) => permission);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{draft.name}</CardTitle>
            <CardDescription>{draft.description}</CardDescription>
          </div>

          <Badge variant="secondary">{draft.status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5">
        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">Inputs</h3>

          {draft.inputs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No inputs yet. We will add the input editor next.
            </p>
          ) : (
            <div className="grid gap-2">
              {draft.inputs.map((input) => (
                <div key={input.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{input.label}</span>
                    <Badge variant="outline">{input.type}</Badge>
                    {input.required ? <Badge>required</Badge> : null}
                  </div>

                  {input.description ? (
                    <p className="mt-2 text-muted-foreground">
                      {input.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">Workflow blocks</h3>

          {draft.workflow.blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workflow blocks yet. We will add the block editor next.
            </p>
          ) : (
            <div className="grid gap-2">
              {draft.workflow.blocks.map((block, index) => (
                <div key={block.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">{block.label}</span>
                    <Badge variant="secondary">{block.type}</Badge>
                  </div>

                  <p className="mt-2 text-muted-foreground">
                    {block.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">Permissions</h3>

          <div className="flex flex-wrap gap-2">
            {enabledPermissions.length === 0 ? (
              <Badge variant="outline">no permissions enabled</Badge>
            ) : (
              enabledPermissions.map((permission) => (
                <Badge key={permission} variant="outline">
                  {permission}
                </Badge>
              ))
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}