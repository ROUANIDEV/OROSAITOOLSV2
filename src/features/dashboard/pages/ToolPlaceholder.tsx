import { Construction, FolderOpen, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ToolPlaceholderProps = {
  title: string;
  description: string;
};

export function ToolPlaceholder({
  title,
  description,
}: ToolPlaceholderProps) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline">Workspace</Badge>
              <Badge variant="secondary">shadcn UI</Badge>
            </div>

            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-xl border border-dashed bg-muted/40 p-8">
              <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm">
                  <Construction className="size-6 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold">
                  Tool workspace ready
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Next we will move the existing feature logic into this page and
                  rebuild the controls with shadcn components only.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button>
                    <PlayCircle className="size-4" />
                    Start tool
                  </Button>

                  <Button variant="outline">
                    <FolderOpen className="size-4" />
                    Select folder
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace status</CardTitle>
            <CardDescription>
              This page is separated from other tools.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">Layout</span>
              <Badge variant="secondary">Ready</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">UI system</span>
              <Badge variant="secondary">shadcn</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">Custom CSS</span>
              <Badge variant="outline">None</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}