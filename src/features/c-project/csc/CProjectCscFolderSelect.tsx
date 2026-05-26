import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CProjectWorkspaceState } from "@/features/c-project/state/cProjectWorkspaceState";

type CProjectCscFolderSelectProps = {
  state: CProjectWorkspaceState;
  isScanning: boolean;
  onSelectCsc: (path: string) => void;
};

export function CProjectCscFolderSelect({
  state,
  isScanning,
  onSelectCsc,
}: CProjectCscFolderSelectProps) {
  return (
    <Select
      value={state.selectedCscPath ?? undefined}
      onValueChange={onSelectCsc}
      disabled={isScanning}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select CSC folder" />
      </SelectTrigger>

      <SelectContent>
        {state.cscFolders.map((folder) => (
          <SelectItem key={folder.path} value={folder.path}>
            {folder.relativePath || folder.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}