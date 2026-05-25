import { CustomToolWorkflowEditor } from "./blockEditor/CustomToolWorkflowEditor";
import { BuilderHero } from "./BuilderHero";
import { BuilderRoadmap } from "./BuilderRoadmap";
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

  const updateDraftFromEditor = (nextDraft: CustomToolManifest) => {
    setDraft(markCustomToolDraftEdited(nextDraft));
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <BuilderHero
        onCreateDraft={() => setDraft(createBlankCustomTool())}
        onStartHistoryTemplate={() => setDraft(createHistoryUpdaterTemplate())}
      />

      {draft ? (
        <>
          <DraftActions
            saveStatus={saveStatus}
            onDiscardDraft={() => setDraft(null)}
          />

          <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="grid gap-4">
              <ToolMetadataEditor
                draft={draft}
                onDraftChange={updateDraftFromEditor}
              />
              <CustomToolInputsEditor
                draft={draft}
                onDraftChange={updateDraftFromEditor}
              />
              <CustomToolWorkflowEditor
                draft={draft}
                onDraftChange={updateDraftFromEditor}
              />
              <ToolDraftSummary draft={draft} />
            </div>

            <div className="grid content-start gap-4">
              <CustomToolValidationPanel draft={draft} />
              <CustomToolTestPanel draft={draft} onDraftChange={setDraft} />
              <CustomToolPublishPanel draft={draft} onDraftChange={setDraft} />
              <CustomToolPermissionsEditor
                draft={draft}
                onDraftChange={updateDraftFromEditor}
              />
              <StarterBlockCatalog />
            </div>
          </section>
        </>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <BuilderRoadmap />
          <StarterBlockCatalog />
        </section>
      )}
    </main>
  );
}