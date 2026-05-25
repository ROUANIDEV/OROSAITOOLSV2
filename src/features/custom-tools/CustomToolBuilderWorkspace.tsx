import { useState } from "react";

import { CustomToolWorkflowEditor } from "./blockEditor/CustomToolWorkflowEditor";
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
import { usePersistedCustomToolDraft } from "./hooks/usePersistedCustomToolDraft";
import { CustomToolInputsEditor } from "./inputEditor/CustomToolInputsEditor";
import { markCustomToolDraftEdited } from "./model/customToolDraftLifecycle";
import type { CustomToolManifest } from "./model/customToolTypes";
import { CustomToolPermissionsEditor } from "./permissions/CustomToolPermissionsEditor";
import { CustomToolPublishPanel } from "./publish/CustomToolPublishPanel";
import { CustomToolTestPanel } from "./testRun/CustomToolTestPanel";
import {
  createBlankCustomTool,
  createHistoryUpdaterTemplate,
} from "./templates/historyUpdaterTemplate";
import { CustomToolValidationPanel } from "./validation/CustomToolValidationPanel";

export function CustomToolBuilderWorkspace() {
  const { draft, setDraft, saveStatus } = usePersistedCustomToolDraft();
  const [activeStage, setActiveStage] =
    useState<BuilderWorkspaceStage>("canvas");

  const updateDraftFromEditor = (nextDraft: CustomToolManifest) => {
    setDraft(markCustomToolDraftEdited(nextDraft));
  };

  const createDraft = () => {
    setDraft(createBlankCustomTool());
    setActiveStage("overview");
  };

  const createHistoryTemplate = () => {
    setDraft(createHistoryUpdaterTemplate());
    setActiveStage("canvas");
  };

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
            onDraftChange={updateDraftFromEditor}
          />
        );
      case "publish":
        return (
          <CustomToolPublishPanel
            draft={draft}
            onDraftChange={updateDraftFromEditor}
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
          <DraftActions
            saveStatus={saveStatus}
            onDiscardDraft={() => setDraft(null)}
          />

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