import type { CustomToolPermissionSet } from "../../model/customToolTypes";

export type PermissionKey = keyof CustomToolPermissionSet;

export type PermissionOption = {
  key: PermissionKey;
  title: string;
  description: string;
};

export const permissionOptions: PermissionOption[] = [
  {
    key: "fileRead",
    title: "Read files",
    description:
      "Allow blocks to read selected files and scan selected folders.",
  },
  {
    key: "fileWrite",
    title: "Write files",
    description:
      "Allow blocks to create, update, or append content to files.",
  },
  {
    key: "python",
    title: "Run Python",
    description:
      "Allow controlled Python blocks to run during tool execution.",
  },
  {
    key: "network",
    title: "Network access",
    description:
      "Reserved for future blocks that need internet or API access.",
  },
];