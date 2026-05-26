import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AnalysisResultCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AnalysisResultCard({
  title,
  description = "Search all columns or filter each column. Default view shows 20 rows.",
  children,
}: AnalysisResultCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  );
}