export type CrcInputFormat = "text" | "hex" | "binary" | "bytes";

export type CrcPreset = {
  id: string;
  name: string;
  width: string;
  polynomial: string;
  init: string;
  xorOut: string;
  reflectIn: boolean;
  reflectOut: boolean;
  check: string;
  description: string;
};

export type CrcDraft = {
  width: string;
  polynomial: string;
  init: string;
  xorOut: string;
  reflectIn: boolean;
  reflectOut: boolean;
};

export const crcPresets: CrcPreset[] = [
  {
    id: "crc-8",
    name: "CRC-8",
    width: "8",
    polynomial: "0x07",
    init: "0x00",
    xorOut: "0x00",
    reflectIn: false,
    reflectOut: false,
    check: "0xF4",
    description: "Simple CRC-8 profile.",
  },
  {
    id: "crc-16-ibm-3740",
    name: "CRC-16/IBM-3740",
    width: "16",
    polynomial: "0x1021",
    init: "0xFFFF",
    xorOut: "0x0000",
    reflectIn: false,
    reflectOut: false,
    check: "0x29B1",
    description: "Also commonly known as CRC-16/CCITT-FALSE.",
  },
  {
    id: "crc-16-modbus",
    name: "CRC-16/MODBUS",
    width: "16",
    polynomial: "0x8005",
    init: "0xFFFF",
    xorOut: "0x0000",
    reflectIn: true,
    reflectOut: true,
    check: "0x4B37",
    description: "Common Modbus CRC-16 profile.",
  },
  {
    id: "crc-32-iso-hdlc",
    name: "CRC-32/ISO-HDLC",
    width: "32",
    polynomial: "0x04C11DB7",
    init: "0xFFFFFFFF",
    xorOut: "0xFFFFFFFF",
    reflectIn: true,
    reflectOut: true,
    check: "0xCBF43926",
    description: "Standard Ethernet, ZIP, PNG CRC-32 profile.",
  },
  {
    id: "crc-32c",
    name: "CRC-32C/CASTAGNOLI",
    width: "32",
    polynomial: "0x1EDC6F41",
    init: "0xFFFFFFFF",
    xorOut: "0xFFFFFFFF",
    reflectIn: true,
    reflectOut: true,
    check: "0xE3069283",
    description: "Castagnoli CRC-32C polynomial.",
  },
  {
    id: "crc-64-ecma-182",
    name: "CRC-64/ECMA-182",
    width: "64",
    polynomial: "0x42F0E1EBA9EA3693",
    init: "0x0000000000000000",
    xorOut: "0x0000000000000000",
    reflectIn: false,
    reflectOut: false,
    check: "0x6C40DF5F0B497347",
    description: "Common CRC-64 reference profile.",
  },
];

export const defaultCrcPreset =
  crcPresets.find((preset) => preset.id === "crc-32-iso-hdlc") ??
  crcPresets[0];

export const crcExampleInputs: Record<CrcInputFormat, string> = {
  text: "123456789",
  hex: "31 32 33 34 35 36 37 38 39",
  binary:
    "00110001 00110010 00110011 00110100 00110101 00110110 00110111 00111000 00111001",
  bytes: "49, 50, 51, 52, 53, 54, 55, 56, 57",
};

export function presetToDraft(preset: CrcPreset): CrcDraft {
  return {
    width: preset.width,
    polynomial: preset.polynomial,
    init: preset.init,
    xorOut: preset.xorOut,
    reflectIn: preset.reflectIn,
    reflectOut: preset.reflectOut,
  };
}

export function getInputPlaceholder(format: CrcInputFormat): string {
  if (format === "text") {
    return "Example: 123456789";
  }

  if (format === "hex") {
    return "Example: 31 32 33 34 35 36 37 38 39";
  }

  if (format === "binary") {
    return "Example: 00110001 00110010 00110011";
  }

  return "Example: 49, 50, 51, 52, 53";
}

export function formatInputFormat(format: CrcInputFormat): string {
  if (format === "text") {
    return "UTF-8 text";
  }

  if (format === "hex") {
    return "Hex bytes";
  }

  if (format === "binary") {
    return "Binary bytes";
  }

  return "Byte list";
}