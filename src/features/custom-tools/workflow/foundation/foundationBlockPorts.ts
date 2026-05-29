import type {
  FoundationBlockPort,
  FoundationBlockPortRole,
  FoundationDataType,
} from "./foundationBlockTypes";

type FoundationPortOptions = {
  role?: FoundationBlockPortRole;
  dataType?: FoundationDataType;
  required?: boolean;
  description?: string;
};

export function foundationInput(
  id: string,
  label: string,
  options: FoundationPortOptions = {},
): FoundationBlockPort {
  return {
    id,
    label,
    direction: "input",
    role: options.role ?? "data",
    dataType: options.dataType,
    required: options.required,
    description: options.description,
  };
}

export function foundationOutput(
  id: string,
  label: string,
  options: FoundationPortOptions = {},
): FoundationBlockPort {
  return {
    id,
    label,
    direction: "output",
    role: options.role ?? "data",
    dataType: options.dataType,
    required: options.required,
    description: options.description,
  };
}