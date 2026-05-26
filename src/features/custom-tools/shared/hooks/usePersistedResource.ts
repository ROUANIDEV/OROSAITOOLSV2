import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type PersistedResourceStatus = "loading" | "idle" | "saving" | "saved" | "error";

export interface PersistedResourceAdapter<TValue> {
  load: () => Promise<TValue | null> | TValue | null;
  save: (value: TValue) => Promise<void> | void;
  clear?: () => Promise<void> | void;
}

export interface UsePersistedResourceOptions<TValue> {
  initialValue: TValue;
  adapter: PersistedResourceAdapter<TValue>;
  debounceMs?: number;
  enabled?: boolean;
  normalize?: (value: TValue) => TValue;
  onError?: (error: unknown) => void;
}

export interface UsePersistedResourceResult<TValue> {
  value: TValue;
  setValue: React.Dispatch<React.SetStateAction<TValue>>;
  status: PersistedResourceStatus;
  error: unknown;
  reload: () => Promise<void>;
  saveNow: () => Promise<void>;
  clear: () => Promise<void>;
}

export function usePersistedResource<TValue>({
  initialValue,
  adapter,
  debounceMs = 300,
  enabled = true,
  normalize = (value) => value,
  onError,
}: UsePersistedResourceOptions<TValue>): UsePersistedResourceResult<TValue> {
  const [value, setValue] = useState<TValue>(initialValue);
  const [status, setStatus] = useState<PersistedResourceStatus>(enabled ? "loading" : "idle");
  const [error, setError] = useState<unknown>(null);
  const hasLoadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reportError = useCallback((nextError: unknown) => {
    setError(nextError);
    setStatus("error");
    onError?.(nextError);
  }, [onError]);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setStatus("loading");
    try {
      const loaded = await adapter.load();
      setValue(loaded == null ? initialValue : normalize(loaded));
      hasLoadedRef.current = true;
      setError(null);
      setStatus("idle");
    } catch (nextError) {
      hasLoadedRef.current = true;
      reportError(nextError);
    }
  }, [adapter, enabled, initialValue, normalize, reportError]);

  const saveNow = useCallback(async () => {
    if (!enabled || !hasLoadedRef.current) return;
    setStatus("saving");
    try {
      await adapter.save(normalize(value));
      setError(null);
      setStatus("saved");
    } catch (nextError) {
      reportError(nextError);
    }
  }, [adapter, enabled, normalize, reportError, value]);

  const clear = useCallback(async () => {
    if (!adapter.clear) return;
    try {
      await adapter.clear();
      setValue(initialValue);
      setError(null);
      setStatus("idle");
    } catch (nextError) {
      reportError(nextError);
    }
  }, [adapter, initialValue, reportError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!enabled || !hasLoadedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveNow();
    }, debounceMs);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [debounceMs, enabled, saveNow, value]);

  return useMemo(() => ({ value, setValue, status, error, reload, saveNow, clear }), [clear, error, reload, saveNow, status, value]);
}
