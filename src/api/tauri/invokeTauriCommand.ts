import { invoke } from "@tauri-apps/api/core";

import type { TauriCommandName } from "@/api/tauri/tauriCommandNames";

type TauriCommandArgs = Record<string, unknown>;

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

function buildTauriErrorMessage(
  command: TauriCommandName,
  error: unknown,
): string {
  const details = normalizeErrorMessage(error);

  return `Tauri command "${command}" failed: ${details}`;
}

export class TauriCommandError extends Error {
  readonly command: TauriCommandName;
  readonly originalError: unknown;

  constructor(command: TauriCommandName, originalError: unknown) {
    super(buildTauriErrorMessage(command, originalError));

    this.name = "TauriCommandError";
    this.command = command;
    this.originalError = originalError;
  }
}

export async function invokeTauriCommand<TResult>(
  command: TauriCommandName,
  args?: TauriCommandArgs,
): Promise<TResult> {
  try {
    return await invoke<TResult>(command, args);
  } catch (error) {
    throw new TauriCommandError(command, error);
  }
}