import { invoke } from "@tauri-apps/api/core";

import type {
  CrcDraft,
  CrcInputFormat,
} from "@/features/crc/crc-config";

export type CrcCalculationRequest = {
  payload: string;
  inputFormat: CrcInputFormat;
  width: number;
  polynomial: string;
  init: string;
  xorOut: string;
  reflectIn: boolean;
  reflectOut: boolean;
};

export type CrcCalculationResult = {
  value: string;
  decimal: string;
  binary: string;
  bytes: number;
  width: number;
  mask: string;
  normalized: {
    polynomial: string;
    init: string;
    xorOut: string;
    reflectedPolynomial: string;
  };
};

export async function calculateCrc(
  payload: string,
  inputFormat: CrcInputFormat,
  draft: CrcDraft,
): Promise<CrcCalculationResult> {
  return invoke<CrcCalculationResult>("calculate_crc", {
    request: {
      payload,
      inputFormat,
      width: Number(draft.width),
      polynomial: draft.polynomial,
      init: draft.init,
      xorOut: draft.xorOut,
      reflectIn: draft.reflectIn,
      reflectOut: draft.reflectOut,
    } satisfies CrcCalculationRequest,
  });
}