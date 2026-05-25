import { invoke } from "@tauri-apps/api/core";

import { tauriCommandNames } from "@/api/tauri/tauriCommandNames";

import type { CustomToolManifest } from "../model/customToolTypes";

const PUBLISHED_TOOLS_KEY = "custom_tools.published_tools";

type AppDataDocument<TData> = {
  schemaVersion: number;
  key: string;
  updatedAtMs: number;
  data: TData;
};

type PublishedToolsData = {
  tools: CustomToolManifest[];
};

function createEmptyPublishedToolsData(): PublishedToolsData {
  return {
    tools: [],
  };
}

export async function loadPublishedCustomTools() {
  try {
    const document = await invoke<AppDataDocument<PublishedToolsData> | null>(
      tauriCommandNames.appDataRead,
      {
        key: PUBLISHED_TOOLS_KEY,
      },
    );

    return document?.data.tools ?? [];
  } catch (error) {
    console.info("[custom-tools-storage] No published tools found.", error);
    return [];
  }
}

export async function savePublishedCustomTools(tools: CustomToolManifest[]) {
  await invoke<AppDataDocument<PublishedToolsData>>(
    tauriCommandNames.appDataWrite,
    {
      key: PUBLISHED_TOOLS_KEY,
      data: {
        ...createEmptyPublishedToolsData(),
        tools,
      },
    },
  );
}

export async function upsertPublishedCustomTool(tool: CustomToolManifest) {
  const tools = await loadPublishedCustomTools();
  const withoutCurrentTool = tools.filter((item) => item.id !== tool.id);

  await savePublishedCustomTools([...withoutCurrentTool, tool]);
}

export async function deletePublishedCustomTool(toolId: string) {
  const tools = await loadPublishedCustomTools();
  const nextTools = tools.filter((tool) => tool.id !== toolId);

  await savePublishedCustomTools(nextTools);

  return nextTools;
}