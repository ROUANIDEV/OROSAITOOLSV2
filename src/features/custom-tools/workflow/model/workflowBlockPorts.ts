import {
  isFoundationCustomToolBlockType,
  type CustomToolBlock,
} from "../../domain/customToolTypes";
import {
  getFoundationBlockDefinition,
  type FoundationBlockPort,
} from "../foundation";
import type { WorkflowBlockLayout } from "../graph/workflowCanvasLayout";

export type WorkflowInputPortSide = "left" | "top" | "bottom";
export type WorkflowPortKind = "control" | "data" | "scope";

export type WorkflowInputPort = {
  id: string;
  label: string;
  side: WorkflowInputPortSide;
  kind: WorkflowPortKind;
  dataType?: string;
  required?: boolean;
  description?: string;
};

export type WorkflowOutputPort = {
  id: string;
  label: string;
  kind: WorkflowPortKind;
  dataType?: string;
  description?: string;
};

export type WorkflowBlockPorts = {
  inputs: WorkflowInputPort[];
  outputs: WorkflowOutputPort[];
};

export type WorkflowPortTarget = {
  blockId: string;
  portId: string;
};

export type WorkflowPortConnectionPulse = {
  fromBlockId: string;
  fromPortId: string;
  toBlockId: string;
  toPortId: string;
  token: number;
};

function input(
  id: string,
  label: string,
  side: WorkflowInputPortSide,
  options: Partial<Omit<WorkflowInputPort, "id" | "label" | "side">> = {},
): WorkflowInputPort {
  return {
    id,
    label,
    side,
    kind: options.kind ?? "data",
    dataType: options.dataType,
    required: options.required,
    description: options.description,
  };
}

function output(
  id: string,
  label: string,
  options: Partial<Omit<WorkflowOutputPort, "id" | "label">> = {},
): WorkflowOutputPort {
  return {
    id,
    label,
    kind: options.kind ?? "data",
    dataType: options.dataType,
    description: options.description,
  };
}

function toPortKind(port: FoundationBlockPort): WorkflowPortKind {
  if (port.role === "control") return "control";
  if (port.role === "scope") return "scope";
  return "data";
}

function formatFoundationPortLabel(port: FoundationBlockPort) {
  return port.dataType ? `${port.label} · ${port.dataType}` : port.label;
}

function getFoundationInputPortSide(
  port: FoundationBlockPort,
): WorkflowInputPortSide {
  if (port.role === "control") return "top";
  if (port.role === "scope") return "bottom";
  return "left";
}

function hasInputPort(ports: WorkflowInputPort[], id: string) {
  return ports.some((port) => port.id === id);
}

function hasOutputPort(ports: WorkflowOutputPort[], id: string) {
  return ports.some((port) => port.id === id);
}

function getFoundationBlockPorts(block: CustomToolBlock): WorkflowBlockPorts {
  if (!isFoundationCustomToolBlockType(block.type)) {
    return { inputs: [], outputs: [] };
  }

  const definition = getFoundationBlockDefinition(block.type);
  const inputs = definition.inputs.map((port) =>
    input(port.id, formatFoundationPortLabel(port), getFoundationInputPortSide(port), {
      kind: toPortKind(port),
      dataType: port.dataType,
      required: port.required,
      description: port.description,
    }),
  );
  const outputs = definition.outputs.map((port) =>
    output(port.id, formatFoundationPortLabel(port), {
      kind: toPortKind(port),
      dataType: port.dataType,
      description: port.description,
    }),
  );

  if (!hasInputPort(inputs, "run")) {
    inputs.unshift(
      input("run", "Run", "top", {
        kind: "control",
        description: "Connect a previous block's Next/Completed output here to run this block after it.",
      }),
    );
  }

  if (!hasOutputPort(outputs, "next")) {
    outputs.push(
      output("next", "Next", {
        kind: "control",
        description: "Connect this to another block's Run input to run it next.",
      }),
    );
  }

  return { inputs, outputs };
}

export function getBlockPorts(block: CustomToolBlock): WorkflowBlockPorts {
  if (isFoundationCustomToolBlockType(block.type)) {
    return getFoundationBlockPorts(block);
  }

  switch (block.type) {
    case "file.glob":
      return {
        inputs: [input("folder", "Folder", "left", { dataType: "folder" })],
        outputs: [
          output("files", "Files", { dataType: "array" }),
          output("fileCount", "Count", { dataType: "number" }),
        ],
      };
    case "file.read":
      return {
        inputs: [
          input("file", "File", "left", { dataType: "file" }),
          input("source", "Source", "top", { kind: "control" }),
        ],
        outputs: [
          output("content", "Content", { dataType: "text" }),
          output("path", "Path", { dataType: "file" }),
        ],
      };
    case "text.template":
      return {
        inputs: [
          input("template", "Template", "left", { dataType: "text" }),
          input("inputs", "Inputs", "top", { kind: "control" }),
          input("outputs", "Outputs", "bottom", { kind: "scope" }),
        ],
        outputs: [output("text", "Text", { dataType: "text" })],
      };
    case "python.code":
      return {
        inputs: [
          input("stdin", "JSON stdin", "left", { dataType: "json" }),
          input("context", "Context", "top", { kind: "control" }),
        ],
        outputs: [
          output("json", "JSON", { dataType: "json" }),
          output("stdout", "Stdout", { dataType: "text" }),
          output("stderr", "Stderr", { dataType: "text" }),
        ],
      };
    case "safety.preview":
      return {
        inputs: [
          input("content", "Content", "left", { dataType: "text" }),
          input("target", "Target", "top", { kind: "control" }),
        ],
        outputs: [output("preview", "Preview", { dataType: "object" })],
      };
    case "file.appendText":
      return {
        inputs: [
          input("file", "File", "left", { dataType: "file" }),
          input("text", "Text", "top", { dataType: "text" }),
          input("confirmation", "Confirm", "bottom", { kind: "scope" }),
        ],
        outputs: [
          output("bytesAppended", "Bytes", { dataType: "number" }),
          output("status", "Status", { dataType: "text" }),
        ],
      };
    case "safety.confirm":
      return {
        inputs: [input("preview", "Preview", "left", { dataType: "object" })],
        outputs: [
          output("confirmed", "Confirmed", { dataType: "boolean" }),
          output("message", "Message", { dataType: "text" }),
        ],
      };
    default:
      return {
        inputs: [input("input", "Input", "left")],
        outputs: [output("output", "Output")],
      };
  }
}

function getSidePorts(
  block: CustomToolBlock,
  side: WorkflowInputPortSide,
): WorkflowInputPort[] {
  return getBlockPorts(block).inputs.filter((port) => port.side === side);
}

function getEvenPosition(index: number, count: number) {
  if (count <= 1) return 0.5;
  return (index + 1) / (count + 1);
}

export function getInputPortAnchor(
  block: CustomToolBlock,
  layout: WorkflowBlockLayout,
  portId?: string,
) {
  const ports = getBlockPorts(block).inputs;
  const port = ports.find((item) => item.id === portId) ?? ports[0];

  if (!port) {
    return {
      x: layout.x,
      y: layout.y + layout.height / 2,
      side: "left" as WorkflowInputPortSide,
    };
  }

  const sidePorts = getSidePorts(block, port.side);
  const sideIndex = Math.max(
    0,
    sidePorts.findIndex((item) => item.id === port.id),
  );
  const position = getEvenPosition(sideIndex, sidePorts.length);

  if (port.side === "top") {
    return { x: layout.x + layout.width * position, y: layout.y, side: port.side };
  }

  if (port.side === "bottom") {
    return {
      x: layout.x + layout.width * position,
      y: layout.y + layout.height,
      side: port.side,
    };
  }

  return { x: layout.x, y: layout.y + layout.height * position, side: port.side };
}

export function getOutputPortAnchor(
  block: CustomToolBlock,
  layout: WorkflowBlockLayout,
  portId?: string,
) {
  const ports = getBlockPorts(block).outputs;
  const portIndex = Math.max(
    0,
    ports.findIndex((item) => item.id === portId),
  );
  const position = getEvenPosition(portIndex, Math.max(1, ports.length));

  return {
    x: layout.x + layout.width,
    y: layout.y + layout.height * position,
  };
}

export function getInputPortHitTargets(
  block: CustomToolBlock,
  layout: WorkflowBlockLayout,
) {
  return getBlockPorts(block).inputs.map((port) => {
    const anchor = getInputPortAnchor(block, layout, port.id);
    return {
      blockId: block.id,
      portId: port.id,
      label: port.label,
      x: anchor.x,
      y: anchor.y,
      radius: 10,
    };
  });
}
