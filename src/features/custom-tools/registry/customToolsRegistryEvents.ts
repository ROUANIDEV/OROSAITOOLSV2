export const CUSTOM_TOOLS_REGISTRY_EVENT = "custom-tools:registry-changed";

export function notifyCustomToolsRegistryChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CUSTOM_TOOLS_REGISTRY_EVENT));
}