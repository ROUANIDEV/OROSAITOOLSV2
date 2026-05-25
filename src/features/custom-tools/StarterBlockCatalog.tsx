import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { starterBlocks } from "./builderData";

export function StarterBlockCatalog() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Starter block catalog</CardTitle>
        <CardDescription>
          First blocks we will support for the history document updater MVP.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-2">
        {starterBlocks.map((block) => (
          <div
            key={block}
            className="flex items-center justify-between rounded-lg border p-3 text-sm"
          >
            <span>{block}</span>
            <Badge variant="outline">planned</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}