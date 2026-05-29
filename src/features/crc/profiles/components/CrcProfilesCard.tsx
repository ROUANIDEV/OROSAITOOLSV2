import { useState } from "react";

import { BookmarkPlus, FolderOpen, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CrcDraft } from "../../model";
import { formatSavedCrcProfileDate, SavedCrcProfile } from "../model";

type CrcProfilesCardProps = {
  draft: CrcDraft;
  profiles: SavedCrcProfile[];
  disabled?: boolean;
  onSave: (name: string, description: string) => void;
  onLoad: (profile: SavedCrcProfile) => void;
  onDelete: (profileId: string) => void;
  onClear: () => void;
};

export function CrcProfilesCard({
  draft,
  profiles,
  disabled = false,
  onSave,
  onLoad,
  onDelete,
  onClear,
}: CrcProfilesCardProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSave() {
    onSave(name, description);
    setName("");
    setDescription("");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookmarkPlus className="size-5" />
              Saved CRC profiles
            </CardTitle>
            <CardDescription>
              Save custom polynomial, init, xorout, width, and reflection
              settings for reuse.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={disabled || profiles.length === 0}
          >
            <Trash2 className="size-4" />
            Clear profiles
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <Input
              value={name}
              disabled={disabled}
              onChange={(event) => setName(event.target.value)}
              placeholder="Profile name, e.g. My Protocol CRC"
            />

            <Input
              value={description}
              disabled={disabled}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
            />

            <Button
              type="button"
              onClick={handleSave}
              disabled={disabled || !draft.width || !draft.polynomial}
            >
              <Save className="size-4" />
              Save profile
            </Button>
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
            <FolderOpen className="mx-auto mb-3 size-7 text-muted-foreground" />
            <p className="font-medium">No saved CRC profiles yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure a custom CRC, give it a name, then save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="rounded-lg border bg-card p-4 transition hover:bg-accent/50"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div>
                      <p className="font-medium">{profile.name}</p>

                      {profile.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {profile.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md border px-2 py-1">
                        Width: {profile.draft.width}
                      </span>
                      <span className="rounded-md border px-2 py-1">
                        Poly: {profile.draft.polynomial}
                      </span>
                      <span className="rounded-md border px-2 py-1">
                        Init: {profile.draft.init}
                      </span>
                      <span className="rounded-md border px-2 py-1">
                        Xorout: {profile.draft.xorOut}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Updated {formatSavedCrcProfileDate(profile.updatedAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onLoad(profile)}
                      disabled={disabled}
                    >
                      Load
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(profile.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}