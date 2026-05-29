import type { ReactNode } from "react";

import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function CrcField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function CrcInfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-medium">{value}</p>
    </div>
  );
}

export function CrcToggleCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "rounded-lg border bg-card p-4 text-left transition hover:bg-accent",
        checked && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <div
          className={cn(
            "flex size-5 items-center justify-center rounded-full border",
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-background",
          )}
        >
          {checked && <CheckCircle2 className="size-3.5" />}
        </div>
      </div>
    </button>
  );
}

export const crcSelectClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";