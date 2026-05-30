import type {
  FoundationBlockCategory,
  FoundationBlockPaletteTone,
  FoundationBlockVisualToken,
} from "./foundationBlockTypes";

function visualToken(
  tone: FoundationBlockPaletteTone,
  icon: string,
  accentClassName: string,
  surfaceClassName: string,
  borderClassName: string,
  textClassName: string,
  badgeClassName: string,
): FoundationBlockVisualToken {
  return {
    tone,
    icon,
    accentClassName,
    surfaceClassName,
    borderClassName,
    textClassName,
    badgeClassName,
  };
}

export const foundationVisualTokensByCategory = {
  io: visualToken(
    "rose",
    "Cable",
    "bg-rose-500",
    "bg-rose-500/10",
    "border-rose-500/45",
    "text-rose-700 dark:text-rose-300",
    "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  ),
  data: visualToken(
    "sky",
    "Database",
    "bg-sky-500",
    "bg-sky-500/10",
    "border-sky-500/40",
    "text-sky-700 dark:text-sky-300",
    "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  ),
  math: visualToken(
    "amber",
    "Calculator",
    "bg-amber-500",
    "bg-amber-500/10",
    "border-amber-500/45",
    "text-amber-700 dark:text-amber-300",
    "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  ),
  logic: visualToken(
    "violet",
    "GitCompareArrows",
    "bg-violet-500",
    "bg-violet-500/10",
    "border-violet-500/45",
    "text-violet-700 dark:text-violet-300",
    "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  ),
  scope: visualToken(
    "slate",
    "Braces",
    "bg-slate-500",
    "bg-slate-500/10",
    "border-slate-500/40",
    "text-slate-700 dark:text-slate-300",
    "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  ),
  function: visualToken(
    "violet",
    "FunctionSquare",
    "bg-violet-500",
    "bg-violet-500/10",
    "border-violet-500/40",
    "text-violet-700 dark:text-violet-300",
    "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  ),
  "control-flow": visualToken(
    "amber",
    "GitBranch",
    "bg-amber-500",
    "bg-amber-500/10",
    "border-amber-500/40",
    "text-amber-700 dark:text-amber-300",
    "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  ),
  collection: visualToken(
    "emerald",
    "Rows3",
    "bg-emerald-500",
    "bg-emerald-500/10",
    "border-emerald-500/40",
    "text-emerald-700 dark:text-emerald-300",
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  ),
} satisfies Record<FoundationBlockCategory, FoundationBlockVisualToken>;

export function getFoundationVisualToken(
  category: FoundationBlockCategory,
): FoundationBlockVisualToken {
  return foundationVisualTokensByCategory[category];
}
