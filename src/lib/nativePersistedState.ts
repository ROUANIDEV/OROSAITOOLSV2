import { useEffect, useRef } from "react";

import { readAppData, writeAppData } from "@/lib/appDataStorage";

type NormalizeState<T> = (value: Partial<T>) => T;
type PrepareStateForStorage<T> = (value: T) => T;

export type LoadNativePersistedStateOptions<T extends object> = {
  key: string;
  fallback: T;
  normalize: NormalizeState<T>;
};

export type SaveNativePersistedStateOptions<T extends object> = {
  key: string;
  value: T;
  prepare?: PrepareStateForStorage<T>;
};

export type UseDebouncedNativePersistedStateSaveOptions<T extends object> =
  SaveNativePersistedStateOptions<T> & {
    enabled: boolean;
    debounceMs?: number;
  };

const DEFAULT_SAVE_DEBOUNCE_MS = 600;

export async function loadNativePersistedState<T extends object>({
  key,
  fallback,
  normalize,
}: LoadNativePersistedStateOptions<T>): Promise<T> {
  const nativeValue = await readNativeValue<T>(key);

  if (nativeValue !== null) {
    return normalize({
      ...fallback,
      ...nativeValue,
    });
  }

  return fallback;
}

export async function saveNativePersistedState<T extends object>({
  key,
  value,
  prepare,
}: SaveNativePersistedStateOptions<T>): Promise<void> {
  const valueToSave = prepare ? prepare(value) : value;

  try {
    await writeAppData(key, valueToSave);
  } catch (error) {
    console.error(`Failed to save native app data for key "${key}".`, error);
  }
}

export function useDebouncedNativePersistedStateSave<T extends object>({
  key,
  value,
  prepare,
  enabled,
  debounceMs = DEFAULT_SAVE_DEBOUNCE_MS,
}: UseDebouncedNativePersistedStateSaveOptions<T>): void {
  const timeoutIdRef = useRef<number | null>(null);

  const latestSaveRef = useRef<SaveNativePersistedStateOptions<T>>({
    key,
    value,
    prepare,
  });

  latestSaveRef.current = {
    key,
    value,
    prepare,
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (typeof window === "undefined") {
      void saveNativePersistedState(latestSaveRef.current);
      return;
    }

    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    timeoutIdRef.current = window.setTimeout(() => {
      timeoutIdRef.current = null;
      void saveNativePersistedState(latestSaveRef.current);
    }, debounceMs);

    return () => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [key, value, prepare, enabled, debounceMs]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    function flushPendingSave() {
      if (timeoutIdRef.current === null) {
        return;
      }

      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;

      void saveNativePersistedState(latestSaveRef.current);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushPendingSave();
      }
    }

    window.addEventListener("pagehide", flushPendingSave);
    window.addEventListener("beforeunload", flushPendingSave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushPendingSave);
      window.removeEventListener("beforeunload", flushPendingSave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      flushPendingSave();
    };
  }, [enabled]);
}

async function readNativeValue<T extends object>(
  key: string,
): Promise<Partial<T> | null> {
  try {
    return await readAppData<Partial<T>>(key);
  } catch (error) {
    console.error(`Failed to read native app data for key "${key}".`, error);
    return null;
  }
}