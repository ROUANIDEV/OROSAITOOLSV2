import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomToolRunHistoryPanel } from "@/features/custom-tools/history/CustomToolRunHistoryPanel";
import type { CustomToolManifest } from "@/features/custom-tools/model/customToolTypes";
import { loadPublishedCustomTools } from "@/features/custom-tools/storage/publishedCustomToolsStorage";
import { createInitialTestValues } from "@/features/custom-tools/testRun/createInitialTestValues";
import type { TestInputValues } from "@/features/custom-tools/testRun/testRunTypes";

import { RunnerDryRunCard } from "./RunnerDryRunCard";
import { RunnerInputForm } from "./RunnerInputForm";
import { findRunnerTool } from "./runnerToolResolver";

const REGISTRY_CHANGED_EVENT = "custom-tools-registry-changed";

type CustomToolRunnerWorkspaceProps = {
  routeId: `custom:${string}`;
};

export function CustomToolRunnerWorkspace({
  routeId,
}: CustomToolRunnerWorkspaceProps) {
  const [publishedTools, setPublishedTools] = useState<CustomToolManifest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [values, setValues] = useState<TestInputValues>({});
  const [historyRefreshSignal, setHistoryRefreshSignal] = useState(0);

  const loadTools = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    setLoadError("");

    try {
      const tools = await loadPublishedCustomTools();
      setPublishedTools(tools);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load published custom tools.",
      );
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadTools();

    const refreshTools = () => {
      void loadTools(false);
    };

    window.addEventListener(REGISTRY_CHANGED_EVENT, refreshTools);

    return () => {
      window.removeEventListener(REGISTRY_CHANGED_EVENT, refreshTools);
    };
  }, [loadTools]);

  const tool = useMemo(
    () => findRunnerTool(routeId, publishedTools),
    [routeId, publishedTools],
  );

  useEffect(() => {
    if (!tool) {
      setValues({});
      return;
    }

    setValues(createInitialTestValues(tool));
  }, [tool]);

  const updateValue = (
    inputId: string,
    value: string | number | boolean,
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [inputId]: value,
    }));
  };

  const refreshHistory = () => {
    setHistoryRefreshSignal((currentSignal) => currentSignal + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Loading the published tool definition...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load custom tools</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!tool) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Published tool not found</CardTitle>
          <CardDescription>
            This sidebar item no longer matches a published custom tool.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Published custom tool
        </p>
        <h1 className="text-2xl font-semibold">{tool.name}</h1>
        <p className="text-muted-foreground">{tool.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
          <CardDescription>
            Fill in sample values before running the tool simulation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RunnerInputForm
            tool={tool}
            values={values}
            onValueChange={updateValue}
          />
        </CardContent>
      </Card>

      <RunnerDryRunCard
        tool={tool}
        values={values}
        onHistoryChange={refreshHistory}
      />

      <CustomToolRunHistoryPanel
        tool={tool}
        refreshSignal={historyRefreshSignal}
      />
    </div>
  );
}