import { useEffect, useMemo } from "react";

import {
  CustomToolWorkflowEditor,
  type CustomToolWorkflowEditorSession,
} from "../../workflow/editor/CustomToolWorkflowEditor";

import { BuilderHero } from "./BuilderHero";
import { BuilderRoadmap } from "./BuilderRoadmap";

import {
  BuilderWorkspaceTabs,
  type BuilderWorkspaceStage,
} from "./BuilderWorkspaceTabs";

import { DraftActions } from "./DraftActions";
import { StarterBlockCatalog } from "./StarterBlockCatalog";
import { ToolDraftSummary } from "./ToolDraftSummary";
import { ToolMetadataEditor } from "./ToolMetadataEditor";

import { usePersistedCustomToolBuilderSession } from "../hooks/usePersistedCustomToolBuilderSession";
import {
  usePersistedCustomToolDraft,
  type DraftSaveStatus,
} from "../hooks/usePersistedCustomToolDraft";

import { CustomToolInputsEditor } from "./inputs/components/CustomToolInputsEditor";
import { markCustomToolDraftEdited } from "../../domain/customToolDraftLifecycle";
import type { CustomToolManifest } from "../../domain/customToolTypes";
import { CustomToolPermissionsEditor } from "./permissions/components/CustomToolPermissionsEditor";
import { CustomToolPublishPanel } from "../../registry/publishing/components/CustomToolPublishPanel";

import {
  CustomToolTestPanel,
  type CustomToolTestPanelSession,
} from "../../runtime/components/CustomToolTestPanel";

import {
  createBlankCustomTool,
  createHistoryUpdaterTemplate,
} from "../../runtime/templates/historyUpdaterTemplate";

import { CustomToolValidationPanel } from "./validation/CustomToolValidationPanel";

function combineSaveStatuses(
  draftSaveStatus: DraftSaveStatus,
  sessionSaveStatus: DraftSaveStatus,
): DraftSaveStatus {
  if (draftSaveStatus === "loading" || sessionSaveStatus === "loading") {
    return "loading";
  }

  if (draftSaveStatus === "error" || sessionSaveStatus === "error") {
    return "error";
  }

  if (draftSaveStatus === "saving" || sessionSaveStatus === "saving") {
    return "saving";
  }

  if (draftSaveStatus === "saved" || sessionSaveStatus === "saved") {
    return "saved";
  }

  return "idle";
}

function getDraftConnectionIds(draft: CustomToolManifest) {
  const workflow = draft.workflow as CustomToolManifest["workflow"] & {
    visualConnections?: { id?: string }[];
  };

  if (!Array.isArray(workflow.visualConnections)) {
    return new Set<string>();
  }

  return new Set(
    workflow.visualConnections
      .map((connection) => connection.id)
      .filter((id): id is string => typeof id === "string"),
  );
}

function sanitizeWorkflowSessionForDraft(
  draft: CustomToolManifest,
  session: CustomToolWorkflowEditorSession,
): CustomToolWorkflowEditorSession {
  const blockIds = new Set(draft.workflow.blocks.map((block) => block.id));
  const connectionIds = getDraftConnectionIds(draft);

  const selectedBlockIds = session.selectedBlockIds.filter((blockId) =>
    blockIds.has(blockId),
  );

  const selectedBlockId =
    session.selectedBlockId && blockIds.has(session.selectedBlockId)
      ? session.selectedBlockId
      : selectedBlockIds[0] ?? null;

  const selectedConnectionId =
    session.selectedConnectionId &&
    connectionIds.has(session.selectedConnectionId)
      ? session.selectedConnectionId
      : null;

  return {
    ...session,
    selectedBlockId,
    selectedBlockIds,
    selectedConnectionId,
    pastWorkflows: session.pastWorkflows.slice(-25),
    futureWorkflows: session.futureWorkflows.slice(0, 25),
  };
}

function sanitizeTestSessionForDraft(
  draft: CustomToolManifest,
  session: CustomToolTestPanelSession,
): CustomToolTestPanelSession {
  const inputIds = new Set(draft.inputs.map((input) => input.id));
  const blockIds = new Set(draft.workflow.blocks.map((block) => block.id));

  const values = Object.entries(session.values).reduce<
    CustomToolTestPanelSession["values"]
  >((nextValues, [inputId, value]) => {
    if (inputIds.has(inputId)) {
      nextValues[inputId] = value;
    }

    return nextValues;
  }, {});

  const outputs = Object.entries(session.outputs).reduce<Record<string, unknown>>(
    (nextOutputs, [blockId, output]) => {
      if (blockIds.has(blockId)) {
        nextOutputs[blockId] = output;
      }

      return nextOutputs;
    },
    {},
  );

  return {
    ...session,
    values,
    logs: session.logs.slice(-120),
    previews: session.previews
      .filter((preview) => blockIds.has(preview.blockId))
      .slice(0, 60),
    executionPlan: session.executionPlan
      .filter((item) => blockIds.has(item.blockId))
      .slice(0, 120),
    outputs,
  };
}

export function CustomToolBuilderWorkspace() {
  const {
    draft,
    setDraft,
    saveStatus: draftSaveStatus,
  } = usePersistedCustomToolDraft();

  const {
    builderSession,
    setBuilderSession,
    saveStatus: sessionSaveStatus,
  } = usePersistedCustomToolBuilderSession();

  const saveStatus = combineSaveStatuses(draftSaveStatus, sessionSaveStatus);

  const activeStage = builderSession.activeStage;

  const workflowSessionByDraftId = builderSession.workflowSessionByDraftId;
  const testSessionByDraftId = builderSession.testSessionByDraftId;

  const setActiveStage = (nextStage: BuilderWorkspaceStage) => {
    setBuilderSession((currentSession) => ({
      ...currentSession,
      activeStage: nextStage,
    }));
  };

  const updateDraftFromEditor = (nextDraft: CustomToolManifest) => {
    setDraft(markCustomToolDraftEdited(nextDraft));
  };

  const updateDraftFromLifecycle = (nextDraft: CustomToolManifest) => {
    setDraft(nextDraft);
  };

  const updateWorkflowSession = (
    draftId: string,
    session: CustomToolWorkflowEditorSession,
  ) => {
    setBuilderSession((currentSession) => ({
      ...currentSession,
      workflowSessionByDraftId: {
        ...currentSession.workflowSessionByDraftId,
        [draftId]: session,
      },
    }));
  };

  const updateTestSession = (
    draftId: string,
    session: CustomToolTestPanelSession,
  ) => {
    setBuilderSession((currentSession) => ({
      ...currentSession,
      testSessionByDraftId: {
        ...currentSession.testSessionByDraftId,
        [draftId]: session,
      },
    }));
  };

  const resetBuilderMemory = (activeStage: BuilderWorkspaceStage) => {
    setBuilderSession({
      schemaVersion: 1,
      activeStage,
      workflowSessionByDraftId: {},
      testSessionByDraftId: {},
    });
  };

  const createDraft = () => {
    const nextDraft = createBlankCustomTool();

    setDraft(nextDraft);
    resetBuilderMemory("overview");
  };

  const createHistoryTemplate = () => {
    const nextDraft = createHistoryUpdaterTemplate();

    setDraft(nextDraft);
    resetBuilderMemory("canvas");
  };

  const discardDraft = () => {
    setDraft(null);
    resetBuilderMemory("canvas");
  };

  useEffect(() => {
    if (!draft) {
      return;
    }

    setBuilderSession((currentSession) => {
      const currentWorkflowSession =
        currentSession.workflowSessionByDraftId[draft.id];

      const currentTestSession = currentSession.testSessionByDraftId[draft.id];

      const nextWorkflowSessionByDraftId = currentWorkflowSession
        ? {
            [draft.id]: sanitizeWorkflowSessionForDraft(
              draft,
              currentWorkflowSession,
            ),
          }
        : {};

      const nextTestSessionByDraftId = currentTestSession
        ? {
            [draft.id]: sanitizeTestSessionForDraft(draft, currentTestSession),
          }
        : {};

      const workflowChanged =
        Object.keys(currentSession.workflowSessionByDraftId).length !==
          Object.keys(nextWorkflowSessionByDraftId).length ||
        currentSession.workflowSessionByDraftId[draft.id] !==
          nextWorkflowSessionByDraftId[draft.id];

      const testChanged =
        Object.keys(currentSession.testSessionByDraftId).length !==
          Object.keys(nextTestSessionByDraftId).length ||
        currentSession.testSessionByDraftId[draft.id] !==
          nextTestSessionByDraftId[draft.id];

      if (!workflowChanged && !testChanged) {
        return currentSession;
      }

      return {
        ...currentSession,
        workflowSessionByDraftId: nextWorkflowSessionByDraftId,
        testSessionByDraftId: nextTestSessionByDraftId,
      };
    });
  }, [draft, setBuilderSession]);

  const currentWorkflowSession = useMemo(() => {
    if (!draft) return undefined;

    return workflowSessionByDraftId[draft.id];
  }, [draft, workflowSessionByDraftId]);

  const currentTestSession = useMemo(() => {
    if (!draft) return undefined;

    return testSessionByDraftId[draft.id];
  }, [draft, testSessionByDraftId]);

  const renderStage = () => {
    if (!draft) return null;

    switch (activeStage) {
      case "overview":
        return (
          <>
            <ToolDraftSummary draft={draft} />

            <ToolMetadataEditor
              draft={draft}
              onDraftChange={updateDraftFromEditor}
            />
          </>
        );

      case "inputs":
        return (
          <CustomToolInputsEditor
            draft={draft}
            onDraftChange={updateDraftFromEditor}
          />
        );

      case "canvas":
        return (
          <CustomToolWorkflowEditor
            draft={draft}
            session={currentWorkflowSession}
            onSessionChange={(nextSession) =>
              updateWorkflowSession(draft.id, nextSession)
            }
            onDraftChange={updateDraftFromEditor}
          />
        );

      case "safety":
        return (
          <>
            <CustomToolPermissionsEditor
              draft={draft}
              onDraftChange={updateDraftFromEditor}
            />

            <CustomToolValidationPanel draft={draft} />
          </>
        );

      case "test":
        return (
          <CustomToolTestPanel
            draft={draft}
            session={currentTestSession}
            onSessionChange={(nextSession) =>
              updateTestSession(draft.id, nextSession)
            }
            onDraftChange={updateDraftFromLifecycle}
          />
        );

      case "publish":
        return (
          <CustomToolPublishPanel
            draft={draft}
            onDraftChange={updateDraftFromLifecycle}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <BuilderHero
        onCreateDraft={createDraft}
        onStartHistoryTemplate={createHistoryTemplate}
      />

      {draft ? (
        <>
          <DraftActions saveStatus={saveStatus} onDiscardDraft={discardDraft} />

          <BuilderWorkspaceTabs
            activeStage={activeStage}
            onStageChange={setActiveStage}
          />

          <div className="space-y-6">{renderStage()}</div>
        </>
      ) : (
        <>
          <StarterBlockCatalog />
          <BuilderRoadmap />
        </>
      )}
    </div>
  );
}