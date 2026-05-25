import type { PermissionOption } from "./permissionOptions";

type PermissionToggleRowProps = {
  option: PermissionOption;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function PermissionToggleRow({
  option,
  checked,
  onCheckedChange,
}: PermissionToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4">
      <div className="grid gap-1">
        <span className="text-sm font-medium">{option.title}</span>
        <span className="text-sm leading-6 text-muted-foreground">
          {option.description}
        </span>
      </div>

      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
    </label>
  );
}