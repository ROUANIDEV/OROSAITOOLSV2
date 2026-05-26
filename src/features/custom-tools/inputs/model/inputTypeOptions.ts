import type { CustomToolInputType } from "../../model/customToolTypes";

export const inputTypeOptions: Array<{
  value: CustomToolInputType;
  label: string;
}> = [
  {
    value: "text",
    label: "Text",
  },
  {
    value: "textarea",
    label: "Long text",
  },
  {
    value: "file",
    label: "File",
  },
  {
    value: "folder",
    label: "Folder",
  },
  {
    value: "number",
    label: "Number",
  },
  {
    value: "boolean",
    label: "Yes / No",
  },
];