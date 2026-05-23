export type ToolStatus = "available" | "planned";

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: ToolStatus;
};

export const tools: ToolDefinition[] = [
  {
    id: "data-dictionary-extractor",
    name: "Data Dictionary Extractor",
    description: "Extract signals, variables, structs, enums, macros, and metadata from C projects.",
    category: "C Project Analysis",
    status: "planned",
  },
  {
    id: "call-tree-extractor",
    name: "Call Tree Extractor",
    description: "Build caller/callee trees from embedded C source code.",
    category: "C Project Analysis",
    status: "planned",
  },
  {
    id: "crc-calculator",
    name: "CRC Calculator",
    description: "Calculate CRC values for common embedded protocols and custom polynomials.",
    category: "Utilities",
    status: "planned",
  },
  {
    id: "bitfield-helper",
    name: "Bitfield Helper",
    description: "Convert, inspect, and document register bitfields.",
    category: "Utilities",
    status: "planned",
  },
];