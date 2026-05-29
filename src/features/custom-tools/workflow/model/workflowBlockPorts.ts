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

export type WorkflowInputPort = {
  id: string;
  label: string;
  side: WorkflowInputPortSide;
};

export type WorkflowOutputPort = {
  id: string;
  label: string;
};

export type WorkflowBlockPorts = {
  inputs: WorkflowInputPort[];
  outputs: WorkflowOutputPort[];
};

export type WorkflowPortTarget = {
  blockId: string;
  portId: string;
};

function input(
  id: string,
  label: string,
  side: WorkflowInputPortSide,
): WorkflowInputPort {
  return { id, label, side };
}

function output(id: string, label: string): WorkflowOutputPort {
  return { id, label };
}

function formatFoundationPortLabel(port: FoundationBlockPort) {
  return port.dataType ? `${port.label} (${port.dataType})` : port.label;
}

function getFoundationInputPortSide(
  port: FoundationBlockPort,
): WorkflowInputPortSide {
  if (port.role === "control") return "top";
  if (port.role === "scope") return "bottom";

  return "left";
}

function getFoundationBlockPorts(block: CustomToolBlock): WorkflowBlockPorts {
  if (!isFoundationCustomToolBlockType(block.type)) {
    return { inputs: [], outputs: [] };
  }

  const definition = getFoundationBlockDefinition(block.type);

  return {
    inputs: definition.inputs.map((port) =>
      input(port.id, formatFoundationPortLabel(port), getFoundationInputPortSide(port)),
    ),
    outputs: definition.outputs.map((port) =>
      output(port.id, formatFoundationPortLabel(port)),
    ),
  };
}

export function getBlockPorts(block: CustomToolBlock): WorkflowBlockPorts {
  if (isFoundationCustomToolBlockType(block.type)) {
    return getFoundationBlockPorts(block);
  }

  switch (block.type) {
    case "file.glob":
      return {
        inputs: [input("folder", "Folder", "left")],
        outputs: [output("files", "Files"), output("fileCount", "Count")],
      };

    case "file.read":
      return {
        inputs: [
          input("file", "File", "left"),
          input("source", "Source", "top"),
        ],
        outputs: [output("content", "Content"), output("path", "Path")],
      };

    case "text.template":
      return {
        inputs: [
          input("template", "Template", "left"),
          input("inputs", "Inputs", "top"),
          input("outputs", "Outputs", "bottom"),
        ],
        outputs: [output("text", "Text")],
      };

    case "python.code":
      return {
        inputs: [
          input("stdin", "JSON stdin", "left"),
          input("context", "Context", "top"),
        ],
        outputs: [
          output("json", "JSON"),
          output("stdout", "Stdout"),
          output("stderr", "Stderr"),
        ],
      };

    case "safety.preview":
      return {
        inputs: [
          input("content", "Content", "left"),
          input("target", "Target", "top"),
        ],
        outputs: [output("preview", "Preview")],
      };

    case "file.appendText":
      return {
        inputs: [
          input("file", "File", "left"),
          input("text", "Text", "top"),
          input("confirmation", "Confirm", "bottom"),
        ],
        outputs: [output("bytesAppended", "Bytes"), output("status", "Status")],
      };

    case "safety.confirm":
      return {
        inputs: [input("preview", "Preview", "left")],
        outputs: [output("confirmed", "Confirmed"), output("message", "Message")],
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
    return {
      x: layout.x + layout.width * position,
      y: layout.y,
      side: port.side,
    };
  }

  if (port.side === "bottom") {
    return {
      x: layout.x + layout.width * position,
      y: layout.y + layout.height,
      side: port.side,
    };
  }

  return {
    x: layout.x,
    y: layout.y + layout.height * position,
    side: port.side,
  };
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
      radius: 18,
    };
  });
}