import { foundationInput, foundationOutput } from "../foundationBlockPorts";
import type { FoundationBlockDefinition } from "../foundationBlockTypes";
import { getFoundationVisualToken } from "../foundationVisualTokens";

export const collectionFoundationBlockDefinitions = [
  {
    kind: "collection.array",
    title: "Create array",
    category: "collection",
    summary: "Create an ordered array value.",
    description:
      "Represents creating an array from literal items or connected block outputs.",
    defaultLabel: "Create array",
    tags: ["array", "collection", "ordered"],
    visual: getFoundationVisualToken("collection"),
    inputs: [
      foundationInput("items", "Items", {
        dataType: "array",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("array", "Array", {
        dataType: "array",
      }),
    ],
    defaultConfig: {
      itemType: "unknown",
      items: [],
    },
  },
  {
    kind: "collection.list",
    title: "Create list",
    category: "collection",
    summary: "Create a mutable ordered list.",
    description:
      "Represents a list that can be appended to, filtered, or mapped later.",
    defaultLabel: "Create list",
    tags: ["list", "collection", "mutable"],
    visual: getFoundationVisualToken("collection"),
    inputs: [
      foundationInput("items", "Initial items", {
        dataType: "array",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("list", "List", {
        dataType: "list",
      }),
    ],
    defaultConfig: {
      itemType: "unknown",
      items: [],
      mutable: true,
    },
  },
  {
    kind: "collection.dictionary",
    title: "Create dictionary",
    category: "collection",
    summary: "Create a key-value collection.",
    description:
      "Represents a dictionary/object/map with string keys and typed values.",
    defaultLabel: "Create dictionary",
    tags: ["dictionary", "map", "object", "key-value"],
    visual: getFoundationVisualToken("collection"),
    inputs: [
      foundationInput("entries", "Entries", {
        dataType: "array",
        required: false,
      }),
    ],
    outputs: [
      foundationOutput("dictionary", "Dictionary", {
        dataType: "dictionary",
      }),
    ],
    defaultConfig: {
      keyType: "string",
      valueType: "unknown",
      entries: [],
    },
  },
  {
    kind: "collection.get",
    title: "Get item",
    category: "collection",
    summary: "Read an item from a collection.",
    description:
      "Represents reading array/list index values or dictionary key values.",
    defaultLabel: "Get item",
    tags: ["collection", "get", "read"],
    visual: getFoundationVisualToken("collection"),
    inputs: [
      foundationInput("collection", "Collection", {
        dataType: "unknown",
        required: true,
      }),
      foundationInput("key", "Key or index", {
        dataType: "unknown",
        required: true,
      }),
    ],
    outputs: [
      foundationOutput("value", "Value", {
        dataType: "unknown",
      }),
    ],
    defaultConfig: {
      key: "",
      fallbackValue: null,
    },
  },
  {
    kind: "collection.set",
    title: "Set item",
    category: "collection",
    summary: "Write an item into a collection.",
    description:
      "Represents setting array/list index values or dictionary key values.",
    defaultLabel: "Set item",
    tags: ["collection", "set", "write"],
    visual: getFoundationVisualToken("collection"),
    inputs: [
      foundationInput("collection", "Collection", {
        dataType: "unknown",
        required: true,
      }),
      foundationInput("key", "Key or index", {
        dataType: "unknown",
        required: true,
      }),
      foundationInput("value", "Value", {
        dataType: "unknown",
        required: true,
      }),
    ],
    outputs: [
      foundationOutput("collection", "Updated collection", {
        dataType: "unknown",
      }),
    ],
    defaultConfig: {
      key: "",
      value: null,
      immutableUpdate: true,
    },
  },
] satisfies readonly FoundationBlockDefinition[];