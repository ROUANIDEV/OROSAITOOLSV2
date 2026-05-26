import { useEffect, useState } from "react";

import type { BuilderWorkspaceStage } from "../components/BuilderWorkspaceTabs";


import type { CustomToolWorkflowEditorSession } from "../../workflow/editor/CustomToolWorkflowEditor";
import type { CustomToolTestPanelSession } from "../../runtime/components/CustomToolTestPanel";
import type { TestInputValues } from "../../runtime/model/testRunTypes";

import {
  loadCustomToolBuilderSession,
  saveCustomToolBuilderSession,
  type CustomToolBuilderSession,
} from "../../persistence/customToolBuilderSessionStorage";

import type { DraftSaveStatus } from "./usePersistedCustomToolDraft";
import { DEFAULT_WORKFLOW_CANVAS_VIEWPORT } from "../../workflow/graph/workflowCanvasViewport";

const SESSION_SAVE_DEBOUNCE_MS = 500;
const MAX_PERSISTED_WORKFLOW_HISTORY = 25;
const MAX_PERSISTED_SELECTED_BLOCKS = 100;
const MAX_PERSISTED_TEST_LOGS = 120;
const MAX_PERSISTED_APPEND_PREVIEWS = 60;
const MAX_PERSISTED_EXECUTION_PLAN_ITEMS = 120;

const BUILDER_STAGES: BuilderWorkspaceStage[] = [
  "overview",
  "inputs",
  "canvas",
  "safety",
  "test",
  "publish",
];

function isBuilderWorkspaceStage(value: unknown): value is BuilderWorkspaceStage {
  return BUILDER_STAGES.includes(value as BuilderWorkspaceStage);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeTestInputValues(value: unknown): TestInputValues {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<TestInputValues>(
    (values, [inputId, inputValue]) => {
      if (
        typeof inputValue === "string" ||
        typeof inputValue === "number" ||
        typeof inputValue === "boolean"
      ) {
        values[inputId] = inputValue;
      }

      return values;
    },
    {},
  );
}

function normalizeWorkflowEditorSession(
  value: unknown,
): CustomToolWorkflowEditorSession | null {
  if (!isRecord(value)) {
    return null;
  }

  const viewport = isRecord(value.viewport)
    ? {
        ...DEFAULT_WORKFLOW_CANVAS_VIEWPORT,
        ...value.viewport,
      }
    : DEFAULT_WORKFLOW_CANVAS_VIEWPORT;

  return {
    paletteCollapsed: asBoolean(value.paletteCollapsed, true),
    viewport,
    pastWorkflows: Array.isArray(value.pastWorkflows)
      ? value.pastWorkflows.slice(-MAX_PERSISTED_WORKFLOW_HISTORY)
      : [],
    futureWorkflows: Array.isArray(value.futureWorkflows)
      ? value.futureWorkflows.slice(0, MAX_PERSISTED_WORKFLOW_HISTORY)
      : [],
    selectedBlockId: asNullableString(value.selectedBlockId),
    selectedBlockIds: isStringArray(value.selectedBlockIds)
      ? value.selectedBlockIds.slice(0, MAX_PERSISTED_SELECTED_BLOCKS)
      : [],
    selectedConnectionId: asNullableString(value.selectedConnectionId),
  };
}

function normalizeWorkflowSessionRecord(
  value: unknown,
): Record<string, CustomToolWorkflowEditorSession> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<
    Record<string, CustomToolWorkflowEditorSession>
  >((sessions, [draftId, sessionValue]) => {
    const session = normalizeWorkflowEditorSession(sessionValue);

    if (session) {
      sessions[draftId] = session;
    }

    return sessions;
  }, {});
}

function normalizeTestPanelSession(
  value: unknown,
): CustomToolTestPanelSession | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    values: normalizeTestInputValues(value.values),
    logs: Array.isArray(value.logs)
      ? value.logs.slice(-MAX_PERSISTED_TEST_LOGS)
      : [],
    previews: Array.isArray(value.previews)
      ? value.previews.slice(0, MAX_PERSISTED_APPEND_PREVIEWS)
      : [],
    executionPlan: Array.isArray(value.executionPlan)
      ? value.executionPlan.slice(0, MAX_PERSISTED_EXECUTION_PLAN_ITEMS)
      : [],
    outputs: isRecord(value.outputs) ? value.outputs : {},
  };
}

function normalizeTestSessionRecord(
  value: unknown,
): Record<string, CustomToolTestPanelSession> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, CustomToolTestPanelSession>>(
    (sessions, [draftId, sessionValue]) => {
      const session = normalizeTestPanelSession(sessionValue);

      if (session) {
        sessions[draftId] = session;
      }

      return sessions;
    },
    {},
  );
}

export function createDefaultCustomToolBuilderSession(
  activeStage: BuilderWorkspaceStage = "canvas",
): CustomToolBuilderSession {
  return {
    schemaVersion: 1,
    activeStage,
    workflowSessionByDraftId: {},
    testSessionByDraftId: {},
  };
}

function normalizeCustomToolBuilderSession(
  session: CustomToolBuilderSession | null,
): CustomToolBuilderSession {
  const defaults = createDefaultCustomToolBuilderSession();

  if (!session || !isRecord(session)) {
    return defaults;
  }

  return {
    schemaVersion: 1,
    activeStage: isBuilderWorkspaceStage(session.activeStage)
      ? session.activeStage
      : defaults.activeStage,
    workflowSessionByDraftId: normalizeWorkflowSessionRecord(
      session.workflowSessionByDraftId,
    ),
    testSessionByDraftId: normalizeTestSessionRecord(
      session.testSessionByDraftId,
    ),
  };
}

function sanitizeCustomToolBuilderSessionForStorage(
  session: CustomToolBuilderSession,
): CustomToolBuilderSession {
  return normalizeCustomToolBuilderSession(session);
}

export function usePersistedCustomToolBuilderSession() {
  const [builderSession, setBuilderSession] =
    useState<CustomToolBuilderSession>(() =>
      createDefaultCustomToolBuilderSession(),
    );

  const [hasLoaded, setHasLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const savedSession = await loadCustomToolBuilderSession();

      if (!isMounted) {
        return;
      }

      setBuilderSession(normalizeCustomToolBuilderSession(savedSession));
      setHasLoaded(true);
      setSaveStatus(savedSession ? "saved" : "idle");
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    let isCancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        setSaveStatus("saving");

        await saveCustomToolBuilderSession(
          sanitizeCustomToolBuilderSessionForStorage(builderSession),
        );

        if (!isCancelled) {
          setSaveStatus("saved");
        }
      } catch (error) {
        console.error("Failed to save custom tool builder session.", error);

        if (!isCancelled) {
          setSaveStatus("error");
        }
      }
    }, SESSION_SAVE_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [builderSession, hasLoaded]);

  return {
    builderSession,
    setBuilderSession,
    saveStatus,
  };
}