import type { CustomToolManifest } from "@/features/custom-tools/domain/customToolTypes";

const ROUTE_PREFIXES = [
  "custom:",
  "custom/",
  "custom-tool:",
  "custom-tool/",
  "custom-tools:",
  "custom-tools/",
];

function normalizeRouteValue(value: string) {
  return decodeURIComponent(value.trim());
}

export function getRunnerToolId(routeId: string) {
  const normalized = normalizeRouteValue(routeId);

  for (const prefix of ROUTE_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      return normalized.slice(prefix.length);
    }
  }

  return normalized;
}

export function findRunnerTool(
  routeId: string,
  publishedTools: CustomToolManifest[],
) {
  const toolId = getRunnerToolId(routeId);

  return (
    publishedTools.find((tool) => tool.id === toolId) ??
    publishedTools.find((tool) => tool.id === routeId) ??
    null
  );
}