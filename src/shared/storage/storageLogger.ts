export type StorageLogger = {
  info: (message: string, error?: unknown) => void;
  warn: (message: string, error?: unknown) => void;
};

export function createStorageLogger(namespace: string): StorageLogger {
  return {
    info(message, error) {
      console.info(`[${namespace}] ${message}`, error);
    },
    warn(message, error) {
      console.warn(`[${namespace}] ${message}`, error);
    },
  };
}
