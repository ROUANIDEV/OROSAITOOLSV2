import type { CrcDraft } from "@/features/crc/crc-config";
import { deleteAppData, readAppData, writeAppData } from "@/lib/appDataStorage";

export type SavedCrcProfile = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  draft: CrcDraft;
};

export const CRC_PROFILES_STORAGE_KEY = "orosaitools.crc.profiles.v1";

const MAX_SAVED_PROFILES = 50;

export async function loadSavedCrcProfiles(): Promise<SavedCrcProfile[]> {
  try {
    const value = await readAppData<unknown>(CRC_PROFILES_STORAGE_KEY);
    return normalizeSavedCrcProfiles(value);
  } catch (error) {
    console.error("Failed to read native CRC profiles.", error);
    return [];
  }
}

export async function saveSavedCrcProfiles(
  profiles: SavedCrcProfile[],
): Promise<void> {
  const normalizedProfiles = normalizeSavedCrcProfiles(profiles);

  try {
    await writeAppData(CRC_PROFILES_STORAGE_KEY, normalizedProfiles);
  } catch (error) {
    console.error("Failed to save CRC profiles in native app data.", error);
  }
}

export function createSavedCrcProfile({
  name,
  description,
  draft,
}: {
  name: string;
  description: string;
  draft: CrcDraft;
}): SavedCrcProfile {
  const now = new Date().toISOString();

  return {
    id: createProfileId(),
    name: name.trim() || "Custom CRC profile",
    description: description.trim(),
    createdAt: now,
    updatedAt: now,
    draft,
  };
}

export function addSavedCrcProfile(
  profiles: SavedCrcProfile[],
  profile: SavedCrcProfile,
): SavedCrcProfile[] {
  const nextProfiles = [
    profile,
    ...profiles.filter((item) => item.id !== profile.id),
  ];

  return nextProfiles.slice(0, MAX_SAVED_PROFILES);
}

export function deleteSavedCrcProfile(
  profiles: SavedCrcProfile[],
  profileId: string,
): SavedCrcProfile[] {
  return profiles.filter((profile) => profile.id !== profileId);
}

export async function clearSavedCrcProfiles(): Promise<void> {
  try {
    await deleteAppData(CRC_PROFILES_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear native CRC profiles.", error);
  }
}

export function formatSavedCrcProfileDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function normalizeSavedCrcProfiles(value: unknown): SavedCrcProfile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isSavedCrcProfile).slice(0, MAX_SAVED_PROFILES);
}

function createProfileId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `crc-profile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isSavedCrcProfile(value: unknown): value is SavedCrcProfile {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Partial<SavedCrcProfile>;

  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.description === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string" &&
    record.draft !== null &&
    typeof record.draft === "object" &&
    typeof record.draft.width === "string" &&
    typeof record.draft.polynomial === "string" &&
    typeof record.draft.init === "string" &&
    typeof record.draft.xorOut === "string" &&
    typeof record.draft.reflectIn === "boolean" &&
    typeof record.draft.reflectOut === "boolean"
  );
}