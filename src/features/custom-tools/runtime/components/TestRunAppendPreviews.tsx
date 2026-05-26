import type { TestRunAppendPreview } from "../model/testRunTypes";

type TestRunAppendPreviewsProps = {
  previews: TestRunAppendPreview[];
};

export function TestRunAppendPreviews({
  previews,
}: TestRunAppendPreviewsProps) {
  if (previews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">Append previews</h4>
        <p className="text-sm text-muted-foreground">
          These previews show what would be appended. The dry run does not read
          or write the target files.
        </p>
      </div>

      {previews.map((preview) => (
        <div key={preview.id} className="space-y-2 rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">{preview.blockLabel}</p>
            <p className="break-all text-xs text-muted-foreground">
              Target: {preview.targetPath}
            </p>
          </div>

          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
            {preview.diffText}
          </pre>
        </div>
      ))}
    </div>
  );
}