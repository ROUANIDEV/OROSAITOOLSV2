import { useEffect, useRef, useState } from "react";

import type { ToolId } from "@/features/dashboard/tool-config";
import { SettingsAppearanceCard } from "@/features/settings/components/SettingsAppearanceCard";
import { SettingsDiagnosticsCard } from "@/features/settings/components/SettingsDiagnosticsCard";
import { SettingsHeaderCard } from "@/features/settings/components/SettingsHeaderCard";
import { SettingsPreferencesCard } from "@/features/settings/components/SettingsPreferencesCard";
import { SettingsStatusCard } from "@/features/settings/components/SettingsStatusCard";
import { SettingsStorageCard } from "@/features/settings/components/SettingsStorageCard";
import {
  clearWorkspaceData,
  defaultSettings,
  loadAppSettings,
  saveAppSettings,
  type AppSettings,
} from "@/features/settings/settings-state";
import {
  buildPreferenceItems,
  type RefreshPathStatus,
} from "@/features/settings/utils/settingsConstants";
import { useTheme } from "@/features/theme/theme-provider";
import { getAppDataPath, openAppDataFolder } from "@/lib/appDataStorage";

type SettingsWorkspaceProps = {
  selectedCscPath: string | null;
  onToolChange: (tool: ToolId) => void;
};

export function SettingsWorkspace({
  selectedCscPath,
  onToolChange,
}: SettingsWorkspaceProps) {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadAppSettings(),
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [appDataPath, setAppDataPath] = useState<string | null>(null);
  const [appDataPathError, setAppDataPathError] = useState<string | null>(null);
  const [isOpeningDataFolder, setIsOpeningDataFolder] = useState(false);
  const [refreshPathStatus, setRefreshPathStatus] =
    useState<RefreshPathStatus>("idle");
  const refreshStatusTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    saveAppSettings(settings);
    setSavedAt(new Date().toISOString());
  }, [settings]);

  useEffect(() => {
    let isMounted = true;

    async function loadNativeJsonStoragePath() {
      try {
        const path = await getAppDataPath();

        if (!isMounted) {
          return;
        }

        setAppDataPath(path);
        setAppDataPathError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAppDataPath(null);
        setAppDataPathError(error instanceof Error ? error.message : String(error));
      }
    }

    void loadNativeJsonStoragePath();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isResetConfirming) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsResetConfirming(false);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isResetConfirming]);

  useEffect(() => {
    if (!resetMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setResetMessage(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resetMessage]);

  useEffect(() => {
    return () => {
      clearRefreshStatusTimeout();
    };
  }, []);

  function updateSetting<Key extends keyof AppSettings>(
    key: Key,
    value: AppSettings[Key],
  ) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
    setResetMessage(null);
  }

  async function handleOpenAppDataFolder() {
    setIsOpeningDataFolder(true);
    setAppDataPathError(null);

    try {
      await openAppDataFolder();
    } catch (error) {
      setAppDataPathError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsOpeningDataFolder(false);
    }
  }

  async function handleRefreshAppDataPath() {
    clearRefreshStatusTimeout();
    setRefreshPathStatus("refreshing");
    setAppDataPathError(null);

    try {
      const refreshedPath = await getAppDataPath();
      const pathDidNotChange = refreshedPath === appDataPath;

      setAppDataPath(refreshedPath);

      if (pathDidNotChange) {
        setRefreshPathStatus("unchanged");
        refreshStatusTimeoutRef.current = window.setTimeout(() => {
          setRefreshPathStatus("idle");
          refreshStatusTimeoutRef.current = null;
        }, 5000);
        return;
      }

      setRefreshPathStatus("idle");
    } catch (error) {
      setRefreshPathStatus("idle");
      setAppDataPathError(error instanceof Error ? error.message : String(error));
    }
  }

  function clearRefreshStatusTimeout() {
    if (refreshStatusTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(refreshStatusTimeoutRef.current);
    refreshStatusTimeoutRef.current = null;
  }

  function handleResetSettings() {
    if (!isResetConfirming) {
      setIsResetConfirming(true);
      setResetMessage(null);
      return;
    }

    saveAppSettings(defaultSettings);
    clearWorkspaceData();
    setSettings(defaultSettings);
    setTheme("system");
    setIsResetConfirming(false);
    setResetMessage("Settings and workspace data were reset.");
  }

  return (
    <section className="grid gap-6">
      <SettingsHeaderCard onToolChange={onToolChange} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsAppearanceCard
          theme={theme}
          onThemeChange={(value) => {
            setTheme(value);
            setResetMessage(null);
          }}
        />

        <SettingsPreferencesCard
          preferenceItems={buildPreferenceItems(settings)}
          onUpdateSetting={updateSetting}
        />
      </div>

      <SettingsStorageCard
        appDataPath={appDataPath}
        appDataPathError={appDataPathError}
        isOpeningDataFolder={isOpeningDataFolder}
        refreshPathStatus={refreshPathStatus}
        onOpenAppDataFolder={handleOpenAppDataFolder}
        onRefreshAppDataPath={() => {
          void handleRefreshAppDataPath();
        }}
      />

      <SettingsDiagnosticsCard
        selectedCscPath={selectedCscPath}
        theme={theme}
        savedAt={savedAt}
        resetMessage={resetMessage}
        isResetConfirming={isResetConfirming}
        onResetSettings={handleResetSettings}
      />

      <SettingsStatusCard />
    </section>
  );
}