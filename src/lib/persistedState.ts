import { useEffect, useState } from "react";

export function loadPersistedState<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    return {
      ...fallback,
      ...JSON.parse(rawValue),
    };
  } catch {
    return fallback;
  }
}

export function savePersistedState<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors.
  }
}

export function usePersistedState<T>(
  key: string,
  fallback: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => loadPersistedState(key, fallback));

  useEffect(() => {
    savePersistedState(key, value);
  }, [key, value]);

  return [value, setValue];
}