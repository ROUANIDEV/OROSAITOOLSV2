import type { CrcDraft } from "@/features/crc/crc-config";

export type SavedCrcProfile = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  draft: CrcDraft;
};

const CRC_PROFILES_STORAGE_KEY = "orosaitools.crc.profiles.v1";
const MAX_SAVED_PROFILES = 50;

export function loadSavedCrcProfiles(): SavedCrcProfile[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CRC_PROFILES_STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isSavedCrcProfile)
      .slice(0, MAX_SAVED_PROFILES);
  } catch {
    return [];
  }
}

export function saveSavedCrcProfiles(profiles: SavedCrcProfile[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CRC_PROFILES_STORAGE_KEY,
      JSON.stringify(profiles.slice(0, MAX_SAVED_PROFILES)),
    );
  } catch {
    // Ignore storage errors.
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

export function clearSavedCrcProfiles(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(CRC_PROFILES_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function formatSavedCrcProfileDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
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