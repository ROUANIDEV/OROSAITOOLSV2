import { removeEntityById, upsertEntityById } from "@/shared/entities";
import {
  createJsonStorage,
  createStorageLogger,
  createTauriJsonStorageAdapter,
} from "@/shared/storage";

import type { CustomToolManifest } from "../model/customToolTypes";

const PUBLISHED_TOOLS_KEY = "custom_tools.published_tools";

type PublishedToolsData = {
  tools: CustomToolManifest[];
};

function createEmptyPublishedToolsData(): PublishedToolsData {
  return {
    tools: [],
  };
}

const publishedToolsStorage = createJsonStorage<PublishedToolsData>({
  key: PUBLISHED_TOOLS_KEY,
  adapter: createTauriJsonStorageAdapter(),
  fallbackData: createEmptyPublishedToolsData,
  logger: createStorageLogger("custom-tools-storage"),
});

export async function loadPublishedCustomTools() {
  const data = await publishedToolsStorage.load();
  return data.tools;
}

export async function savePublishedCustomTools(tools: CustomToolManifest[]) {
  await publishedToolsStorage.save({
    ...createEmptyPublishedToolsData(),
    tools,
  });
}

export async function upsertPublishedCustomTool(tool: CustomToolManifest) {
  const tools = await loadPublishedCustomTools();
  await savePublishedCustomTools(upsertEntityById(tools, tool));
}

export async function deletePublishedCustomTool(toolId: string) {
  const tools = await loadPublishedCustomTools();
  const nextTools = removeEntityById(tools, toolId);

  await savePublishedCustomTools(nextTools);

  return nextTools;
}
