import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CProjectInfoRow } from "@/features/c-project/shared/CProjectInfoRow";
import type { CscFolder } from "@/lib/cProject";

type CProjectSelectedCscCardProps = {
  selectedCsc: CscFolder | null;
};

export function CProjectSelectedCscCard({
  selectedCsc,
}: CProjectSelectedCscCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Selected CSC</CardTitle>
        <CardDescription>
          This selection is shared with the next tools.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {selectedCsc ? (
          <>
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm font-medium">{selectedCsc.name}</p>
              <p className="mt-2 break-all text-xs text-muted-foreground">
                {selectedCsc.path}
              </p>
            </div>

            <div className="grid gap-3 text-sm">
              <CProjectInfoRow label="C/C++ files" value={selectedCsc.cFiles} />
              <CProjectInfoRow
                label="Header files"
                value={selectedCsc.headerFiles}
              />
              <CProjectInfoRow
                label="Sources path"
                value={selectedCsc.sourcesPath ?? "Not detected"}
              />
              <CProjectInfoRow
                label="Include path"
                value={selectedCsc.includePath ?? "Not detected"}
              />
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No CSC selected yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}