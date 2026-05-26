import type { CustomToolRouteId } from "@/features/dashboard/tool-config";

const CUSTOM_TOOL_ROUTE_PREFIX = "custom:";

export function createCustomToolRouteId(toolId: string): CustomToolRouteId {
  return `${CUSTOM_TOOL_ROUTE_PREFIX}${encodeURIComponent(toolId)}`;
}

export function isCustomToolRouteId(value: unknown): value is CustomToolRouteId {
  return (
    typeof value === "string" && value.startsWith(CUSTOM_TOOL_ROUTE_PREFIX)
  );
}

export function getCustomToolIdFromRoute(routeId: CustomToolRouteId) {
  return decodeURIComponent(routeId.slice(CUSTOM_TOOL_ROUTE_PREFIX.length));
}