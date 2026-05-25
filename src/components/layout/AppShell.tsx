import type { AppInfo } from "../../lib/tauri";
import type { ToolDefinition } from "../../features/tools/toolRegistry";
import { CscSelector } from "../../features/c-project/components/csc/CscSelector";
import { ProjectScanPanel } from "../../features/c-project/components/scanner/ProjectScanPanel";
import { ProjectFolderSelector } from "./ProjectFolderSelector";

type AppShellProps = {
  appInfo: AppInfo | null;
  tools: ToolDefinition[];
  selectedProjectPath: string | null;
  selectedCscPath: string | null;
  onProjectPathChange: (path: string | null) => void;
  onCscPathChange: (path: string | null) => void;
};

export function AppShell({
  appInfo,
  tools,
  selectedProjectPath,
  selectedCscPath,
  onProjectPathChange,
  onCscPathChange,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">OT</div>
          <div>
            <h1>{appInfo?.name ?? "OROSAITOOLS"}</h1>
            <p>Embedded toolbox</p>
          </div>
        </div>

        <nav className="nav">
          <button className="nav-item active">Dashboard</button>
          <button className="nav-item">C Project Analysis</button>
          <button className="nav-item">Utilities</button>
          <button className="nav-item">Settings</button>
        </nav>
      </aside>

      <main className="main">
        <section className="hero">
          <div>
            <p className="eyebrow">Desktop engineering suite</p>
            <h2>OROSAITOOLS</h2>
            <p>
              A modular desktop app for embedded software engineers: source-code
              analysis, CRC utilities, register helpers, documentation tools, and more.
            </p>
          </div>

          <div className="version-card">
            <span>Backend status</span>
            <strong>Connected</strong>
            <small>v{appInfo?.version ?? "..."}</small>
          </div>
        </section>

        <ProjectFolderSelector
          selectedProjectPath={selectedProjectPath}
          onProjectPathChange={onProjectPathChange}
        />

        <CscSelector
          selectedProjectPath={selectedProjectPath}
          selectedCscPath={selectedCscPath}
          onCscPathChange={onCscPathChange}
        />

        <ProjectScanPanel selectedCscPath={selectedCscPath} />

        <section className="section-header">
          <div>
            <h3>Tools</h3>
            <p>We will activate these one by one.</p>
          </div>
        </section>

        <section className="tool-grid">
          {tools.map((tool) => (
            <article className="tool-card" key={tool.id}>
              <div className="tool-card-header">
                <span>{tool.category}</span>
                <strong className={`status status-${tool.status}`}>
                  {tool.status}
                </strong>
              </div>

              <h4>{tool.name}</h4>
              <p>{tool.description}</p>

              <button disabled={tool.status !== "available"}>
                {tool.status === "available" ? "Open tool" : "Coming soon"}
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}