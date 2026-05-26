import { AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { CustomToolManifest } from "../../../domain/customToolTypes";
import { validateCustomToolDraft } from "../../../domain/validation/rules/customToolValidation";

type CustomToolValidationPanelProps = {
  draft: CustomToolManifest;
};

export function CustomToolValidationPanel({
  draft,
}: CustomToolValidationPanelProps) {
  const result = validateCustomToolDraft(draft);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Validation</CardTitle>
            <CardDescription>
              Checks whether this draft is ready for testing and publishing.
            </CardDescription>
          </div>

          <Badge variant={result.canPublish ? "secondary" : "destructive"}>
            {result.canPublish ? "valid" : `${result.errorCount} errors`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3">
        {result.messages.length === 0 ? (
          <div className="flex gap-3 rounded-xl border p-3 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="font-medium">No validation issues</p>
              <p className="text-muted-foreground">
                This draft is structurally ready for the next step.
              </p>
            </div>
          </div>
        ) : (
          result.messages.map((message) => {
            const Icon =
              message.severity === "error" ? CircleAlert : AlertTriangle;

            return (
              <div key={message.id} className="flex gap-3 rounded-xl border p-3 text-sm">
                <Icon className="mt-0.5 size-4 text-muted-foreground" />

                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{message.title}</p>
                    <Badge
                      variant={
                        message.severity === "error"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {message.severity}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground">
                    {message.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}