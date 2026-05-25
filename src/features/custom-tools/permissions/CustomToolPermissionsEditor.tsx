import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { CustomToolManifest } from "../model/customToolTypes";
import { permissionOptions, type PermissionKey } from "./permissionOptions";
import { PermissionToggleRow } from "./PermissionToggleRow";

type CustomToolPermissionsEditorProps = {
  draft: CustomToolManifest;
  onDraftChange: (draft: CustomToolManifest) => void;
};

export function CustomToolPermissionsEditor({
  draft,
  onDraftChange,
}: CustomToolPermissionsEditorProps) {
  const updatePermission = (key: PermissionKey, enabled: boolean) => {
    onDraftChange({
      ...draft,
      updatedAt: new Date().toISOString(),
      permissions: {
        ...draft.permissions,
        [key]: enabled,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>
          Control which sensitive capabilities this custom tool can use.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3">
        {permissionOptions.map((option) => (
          <PermissionToggleRow
            key={option.key}
            option={option}
            checked={draft.permissions[option.key]}
            onCheckedChange={(checked) =>
              updatePermission(option.key, checked)
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}