import type { AppDataDocument, NullableAppDataDocument } from "./appDataDocument";
import type { StorageLogger } from "./storageLogger";

export type JsonStorageAdapter = {
  read: <TData>(key: string) => Promise<NullableAppDataDocument<TData>>;
  write: <TData>(key: string, data: TData) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

export type JsonStorageOptions<TData> = {
  key: string;
  adapter: JsonStorageAdapter;
  fallbackData: () => TData;
  logger?: StorageLogger;
};

export type JsonStorage<TData> = {
  load: () => Promise<TData>;
  save: (data: TData) => Promise<void>;
  delete: () => Promise<void>;
};

export function createJsonStorage<TData>({
  key,
  adapter,
  fallbackData,
  logger,
}: JsonStorageOptions<TData>): JsonStorage<TData> {
  return {
    async load() {
      try {
        const document: AppDataDocument<TData> | null = await adapter.read<TData>(key);
        return document?.data ?? fallbackData();
      } catch (error) {
        logger?.info("Unable to load stored data. Falling back to default data.", error);
        return fallbackData();
      }
    },

    async save(data) {
      await adapter.write<TData>(key, data);
    },

    async delete() {
      try {
        await adapter.delete(key);
      } catch (error) {
        logger?.info("No stored data to delete.", error);
      }
    },
  };
}
