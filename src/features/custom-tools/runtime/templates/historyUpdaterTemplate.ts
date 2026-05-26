import type { CustomToolManifest } from "../../domain/customToolTypes";

function createDraftId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function createBlankCustomTool(): CustomToolManifest {
  const now = nowIso();

  return {
    schemaVersion: 1,
    id: createDraftId("custom-tool"),
    name: "Untitled custom tool",
    description: "Describe what this custom tool automates.",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    inputs: [],
    workflow: {
      blocks: [],
    },
    permissions: {
      fileRead: false,
      fileWrite: false,
      python: false,
      network: false,
    },
  };
}

export function createHistoryUpdaterTemplate(): CustomToolManifest {
  const now = nowIso();

  return {
    schemaVersion: 1,
    id: createDraftId("history-document-updater"),
    name: "History Document Updater",
    description:
      "Updates a history document with modified test files, version, and reason.",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    inputs: [
      {
        id: "testFilesFolder",
        label: "Test files folder",
        type: "folder",
        required: true,
        description: "Folder containing the test files to inspect.",
      },
      {
        id: "historyDocument",
        label: "History document",
        type: "file",
        required: true,
        description: "Document that will receive the new history entry.",
        accept: [".md", ".txt", ".csv"],
      },
      {
        id: "newVersion",
        label: "New version",
        type: "text",
        required: true,
        description: "Version value to write into the history document.",
      },
      {
        id: "reason",
        label: "Modification reason",
        type: "textarea",
        required: true,
        description: "Reason why the selected files were modified.",
      },
    ],
    workflow: {
      blocks: [
        {
          id: "find-test-files",
          type: "file.glob",
          label: "Find test files",
          description: "Find test files inside the selected folder.",
          config: {
            rootInput: "testFilesFolder",
            pattern: "**/*test*.*",
          },
        },
        {
          id: "build-history-entry",
          type: "text.template",
          label: "Build history entry",
          description: "Create a text row using version, reason, and file count.",
          config: {
            template:
              "| {{newVersion}} | {{date}} | {{fileCount}} files | {{reason}} |",
          },
        },
        {
          id: "preview-update",
          type: "safety.preview",
          label: "Preview update",
          description: "Show the user what will change before writing.",
          config: {
            targetInput: "historyDocument",
          },
        },
        {
          id: "append-history-entry",
          type: "file.appendText",
          label: "Append history entry",
          description: "Append the generated history entry to the document.",
          config: {
            targetInput: "historyDocument",
          },
        },
      ],
    },
    permissions: {
      fileRead: true,
      fileWrite: true,
      python: false,
      network: false,
    },
  };
}