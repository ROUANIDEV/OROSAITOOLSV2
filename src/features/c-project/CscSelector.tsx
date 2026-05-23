import { useEffect, useMemo, useState } from "react";
import { listCscFolders, type CscFolder } from "../../lib/cProject";

type CscSelectorProps = {
  selectedProjectPath: string | null;
  selectedCscPath: string | null;
  onCscPathChange: (path: string | null) => void;
};

export function CscSelector({
  selectedProjectPath,
  selectedCscPath,
  onCscPathChange,
}: CscSelectorProps) {
  const [cscFolders, setCscFolders] = useState<CscFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedCsc = useMemo(() => {
    return cscFolders.find((csc) => csc.path === selectedCscPath) ?? null;
  }, [cscFolders, selectedCscPath]);

  useEffect(() => {
    let isCancelled = false;

    async function loadCscFolders() {
      if (!selectedProjectPath) {
        setCscFolders([]);
        setLoadError(null);
        onCscPathChange(null);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      onCscPathChange(null);

      try {
        const folders = await listCscFolders(selectedProjectPath);

        if (isCancelled) {
          return;
        }

        setCscFolders(folders);

        if (folders.length === 1) {
          onCscPathChange(folders[0].path);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error(error);
        setLoadError(error instanceof Error ? error.message : String(error));
        setCscFolders([]);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadCscFolders();

    return () => {
      isCancelled = true;
    };
  }, [selectedProjectPath, onCscPathChange]);

  if (!selectedProjectPath) {
    return null;
  }

  return (
    <section className="csc-selector-panel">
      <div className="csc-selector-header">
        <div>
          <p className="eyebrow">CSC selection</p>
          <h3>Select CSC</h3>
          <p>
            A CSC is detected when a folder contains both <code>sources</code>{" "}
            and <code>include</code>. The selected CSC will be used by the Data
            Dictionary and Call Tree tools.
          </p>
        </div>

        <div className="csc-select-wrap">
          <label htmlFor="csc-select">Detected CSC</label>
          <select
            id="csc-select"
            value={selectedCscPath ?? ""}
            onChange={(event) => onCscPathChange(event.target.value || null)}
            disabled={isLoading || cscFolders.length === 0}
          >
            <option value="">
              {isLoading ? "Detecting CSC folders..." : "Select a CSC"}
            </option>

            {cscFolders.map((csc) => (
              <option key={csc.path} value={csc.path}>
                {csc.relativePath || csc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadError && <div className="error-box">{loadError}</div>}

      {!isLoading && !loadError && cscFolders.length === 0 && (
        <div className="warning-box">
          No CSC folder detected. Expected structure:{" "}
          <strong>CSC/sources</strong> and <strong>CSC/include</strong>.
        </div>
      )}

      {selectedCsc && (
        <div className="csc-details-grid">
          <div>
            <span>CSC path</span>
            <strong>{selectedCsc.path}</strong>
          </div>

          <div>
            <span>Sources folder</span>
            <strong>{selectedCsc.sourcesPath}</strong>
          </div>

          <div>
            <span>Include folder</span>
            <strong>{selectedCsc.includePath}</strong>
          </div>

          <div>
            <span>Detected files</span>
            <strong>
              {selectedCsc.cFiles} C files / {selectedCsc.headerFiles} header files
            </strong>
          </div>
        </div>
      )}
    </section>
  );
}