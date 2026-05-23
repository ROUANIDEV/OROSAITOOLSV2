import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { tools, type ToolId } from "@/features/dashboard/tool-config";

type DashboardTopbarProps = {
  activeTool: ToolId;
};

export function DashboardTopbar({ activeTool }: DashboardTopbarProps) {
  const currentTool = tools.find((tool) => tool.id === activeTool) ?? tools[0];

  return (
    <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <SidebarTrigger className="-ml-1" />

      <Separator
        orientation="vertical"
        className="mr-1 data-[orientation=vertical]:h-4"
      />

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate font-medium">
              {currentTool.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ThemeToggle />
    </header>
  );
}