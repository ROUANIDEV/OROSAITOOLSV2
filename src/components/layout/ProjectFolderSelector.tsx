import { selectProjectFolder } from "../../lib/projectFolder";

type ProjectFolderSelectorProps = {
  selectedProjectPath: string | null;
  onProjectPathChange: (path: string | null) => void;
};

export function ProjectFolderSelector({
  selectedProjectPath,
  onProjectPathChange,
}: ProjectFolderSelectorProps) {
  async function handleSelectFolder() {
    try {
      const path = await selectProjectFolder();

      if (path) {
        onProjectPathChange(path);
      }
    } catch (error) {
      console.error("Failed to select project folder:", error);
    }
  }

  function handleClearFolder() {
    onProjectPathChange(null);
  }

  return (
    <section className="project-folder-panel">
      <div>
        <p className="eyebrow">Active workspace</p>
        <h3>C Project Folder</h3>
        <p>
          Select the root folder of your embedded C project. Future tools will
          scan this folder for source files, headers, macros, functions, structs,
          enums, and call relationships.
        </p>
      </div>

      <div className="folder-actions">
        <button className="primary-button" onClick={handleSelectFolder}>
          Select folder
        </button>

        {selectedProjectPath && (
          <button className="secondary-button" onClick={handleClearFolder}>
            Clear
          </button>
        )}
      </div>

      <div className="selected-path-box">
        <span>Selected path</span>
        <strong>{selectedProjectPath ?? "No project folder selected yet"}</strong>
      </div>
    </section>
  );
}