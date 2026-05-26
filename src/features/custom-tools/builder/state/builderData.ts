import {
  Blocks,
  Code2,
  FileClock,
  ListChecks,
  PlayCircle,
  Rocket,
  ShieldCheck,
} from "lucide-react";

export const builderPhases = [
  {
    title: "Define inputs",
    description:
      "Create the fields the user must fill before running the custom tool.",
    icon: ListChecks,
  },
  {
    title: "Build workflow",
    description:
      "Connect reusable blocks like file search, template, preview, and write.",
    icon: Blocks,
  },
  {
    title: "Test safely",
    description:
      "Run the tool in dry-run mode before allowing it to modify files.",
    icon: PlayCircle,
  },
  {
    title: "Publish to sidebar",
    description:
      "After validation, the tool can become available as an official app tool.",
    icon: Rocket,
  },
];

export const starterBlocks = [
  "Text input",
  "File picker",
  "Folder picker",
  "Find files",
  "Template text",
  "Preview diff",
  "Append text",
  "Python code",
];

export const safetyCards = [
  {
    title: "Safety first",
    description:
      "File writes, Python execution, and publishing will be gated by validation and dry-run previews.",
    icon: ShieldCheck,
  },
  {
    title: "Python ready later",
    description:
      "The app can stay Rust and TypeScript while custom code runs through a controlled backend Python runner.",
    icon: Code2,
  },
];

export const historyTemplateAction = {
  label: "Start from history updater",
  icon: FileClock,
};