export type AppDataDocument<TData> = {
  schemaVersion: number;
  key: string;
  updatedAtMs: number;
  data: TData;
};

export type NullableAppDataDocument<TData> = AppDataDocument<TData> | null;
