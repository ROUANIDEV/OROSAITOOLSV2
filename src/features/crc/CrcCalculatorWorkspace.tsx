import { useEffect, useMemo, useRef, useState } from "react";

import {
  Calculator,
  Loader2,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  crcExampleInputs,
  crcPresets,
  defaultCrcPreset,
  presetToDraft,
  type CrcDraft,
  type CrcInputFormat,
} from "@/features/crc/crc-config";
import { CrcHistoryCard } from "@/features/crc/components/CrcHistoryCard";
import { CrcInputCard } from "@/features/crc/components/CrcInputCard";
import { CrcParametersCard } from "@/features/crc/components/CrcParametersCard";
import { CrcProfilesCard } from "@/features/crc/components/CrcProfilesCard";
import {
  CrcProtocolNotesCard,
  CrcSummaryCard,
} from "@/features/crc/components/CrcSummaryCard";
import {
  addCrcHistoryEntry,
  clearCrcHistory,
  createCrcHistoryEntry,
  loadCrcHistory,
  saveCrcHistory,
  type CrcHistoryEntry,
} from "@/features/crc/crc-history";
import {
  addSavedCrcProfile,
  clearSavedCrcProfiles,
  createSavedCrcProfile,
  deleteSavedCrcProfile,
  loadSavedCrcProfiles,
  saveSavedCrcProfiles,
  type SavedCrcProfile,
} from "@/features/crc/crc-profiles";
import { calculateCrc, type CrcCalculationResult } from "@/lib/crc";

type CrcStatus = "idle" | "calculating" | "success" | "error";

export function CrcCalculatorWorkspace() {
  const taskIdRef = useRef<string | null>(null);

  const [crcStorageLoaded, setCrcStorageLoaded] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState(defaultCrcPreset.id);
  const [inputFormat, setInputFormat] = useState<CrcInputFormat>("text");
  const [payload, setPayload] = useState(crcExampleInputs.text);

  const [draft, setDraft] = useState<CrcDraft>(() =>
    presetToDraft(defaultCrcPreset),
  );

  const [status, setStatus] = useState<CrcStatus>("idle");
  const [result, setResult] = useState<CrcCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<CrcHistoryEntry[]>([]);
  const [profiles, setProfiles] = useState<SavedCrcProfile[]>([]);

  const selectedPreset = useMemo(
    () => crcPresets.find((preset) => preset.id === selectedPresetId) ?? null,
    [selectedPresetId],
  );

  const isCalculating = status === "calculating";
  const isStorageLoading = !crcStorageLoaded;
  const isBusy = isCalculating || isStorageLoading;

  useEffect(() => {
    let isMounted = true;

    async function loadStoredCrcData() {
      const [loadedHistory, loadedProfiles] = await Promise.all([
        loadCrcHistory(),
        loadSavedCrcProfiles(),
      ]);

      if (!isMounted) {
        return;
      }

      setHistory(loadedHistory);
      setProfiles(loadedProfiles);
      setCrcStorageLoaded(true);
    }

    void loadStoredCrcData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!crcStorageLoaded) {
      return;
    }

    void saveCrcHistory(history);
  }, [crcStorageLoaded, history]);

  useEffect(() => {
    if (!crcStorageLoaded) {
      return;
    }

    void saveSavedCrcProfiles(profiles);
  }, [crcStorageLoaded, profiles]);

  function clearResult() {
    setStatus("idle");
    setResult(null);
    setError(null);
  }

  function handlePresetChange(presetId: string) {
    const preset = crcPresets.find((item) => item.id === presetId);

    setSelectedPresetId(presetId);
    clearResult();

    if (!preset) {
      return;
    }

    setDraft(presetToDraft(preset));
  }

  function handleInputFormatChange(format: CrcInputFormat) {
    setInputFormat(format);
    clearResult();
  }

  function handlePayloadChange(value: string | ((current: string) => string)) {
    setPayload(value);
    clearResult();
  }

  function handleDraftChange(value: CrcDraft | ((current: CrcDraft) => CrcDraft)) {
    setDraft(value);
    clearResult();
  }

  function handleLoadCheckInput() {
    setInputFormat("text");
    setPayload("123456789");
    clearResult();
  }

  function handleReset() {
    setSelectedPresetId(defaultCrcPreset.id);
    setInputFormat("text");
    setPayload(crcExampleInputs.text);
    setDraft(presetToDraft(defaultCrcPreset));
    clearResult();
  }

  async function handleCalculate() {
    if (isStorageLoading) {
      return;
    }

    const taskId = createTaskId();

    taskIdRef.current = taskId;
    setStatus("calculating");
    setError(null);

    try {
      const nextResult = await calculateCrc(payload, inputFormat, draft);

      if (taskIdRef.current !== taskId) {
        return;
      }

      setResult(nextResult);
      setError(null);
      setStatus("success");

      const historyEntry = createCrcHistoryEntry({
        presetName: selectedPreset?.name ?? "Custom parameters",
        inputFormat,
        payload,
        draft,
        result: nextResult,
      });

      setHistory((current) => addCrcHistoryEntry(current, historyEntry));
    } catch (err) {
      if (taskIdRef.current !== taskId) {
        return;
      }

      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  function handleRestoreHistory(entry: CrcHistoryEntry) {
    const matchingPreset = crcPresets.find(
      (preset) => preset.name === entry.presetName,
    );

    setSelectedPresetId(matchingPreset?.id ?? "custom");
    setInputFormat(entry.inputFormat);
    setPayload(entry.payload);
    setDraft(entry.draft);
    setResult(entry.result);
    setError(null);
    setStatus("success");
  }

  function handleClearHistory() {
    void clearCrcHistory();
    setHistory([]);
  }

  function handleSaveProfile(name: string, description: string) {
    const profile = createSavedCrcProfile({
      name,
      description,
      draft,
    });

    setProfiles((current) => addSavedCrcProfile(current, profile));
  }

  function handleLoadProfile(profile: SavedCrcProfile) {
    setSelectedPresetId("custom");
    setDraft(profile.draft);
    clearResult();
  }

  function handleDeleteProfile(profileId: string) {
    setProfiles((current) => deleteSavedCrcProfile(current, profileId));
  }

  function handleClearProfiles() {
    void clearSavedCrcProfiles();
    setProfiles([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit">
          Workspace
        </Badge>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              CRC Calculator
            </h1>

            <p className="max-w-3xl text-sm text-muted-foreground">
              Calculate CRC values for any protocol using custom width,
              polynomial, initial value, xorout, and reflection settings.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleCalculate} disabled={isBusy}>
              {isCalculating || isStorageLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PlayCircle className="size-4" />
              )}
              {isStorageLoading
                ? "Loading..."
                : isCalculating
                  ? "Calculating..."
                  : "Calculate CRC"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleLoadCheckInput}
              disabled={isBusy}
            >
              <ShieldCheck className="size-4" />
              Load 123456789
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={isBusy}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <Alert>
        <Calculator className="size-4" />
        <AlertTitle>Rust CRC engine active</AlertTitle>
        <AlertDescription>
          Each calculation is sent to a Tauri Rust command. History and custom
          profiles are saved in the app data folder on this device.
        </AlertDescription>
      </Alert>

      <CrcInputCard
        selectedPresetId={selectedPresetId}
        inputFormat={inputFormat}
        payload={payload}
        disabled={isBusy}
        onPresetChange={handlePresetChange}
        onInputFormatChange={handleInputFormatChange}
        onPayloadChange={handlePayloadChange}
      />

      <CrcParametersCard
        draft={draft}
        selectedPreset={selectedPreset}
        disabled={isBusy}
        onDraftChange={handleDraftChange}
        onCustomMode={() => setSelectedPresetId("custom")}
      />

      <CrcSummaryCard
        inputFormat={inputFormat}
        draft={draft}
        selectedPreset={selectedPreset}
        result={result}
        error={error}
        isCalculating={isCalculating}
      />

      <CrcProfilesCard
        draft={draft}
        profiles={profiles}
        disabled={isBusy}
        onSave={handleSaveProfile}
        onLoad={handleLoadProfile}
        onDelete={handleDeleteProfile}
        onClear={handleClearProfiles}
      />

      <CrcHistoryCard
        history={history}
        onRestore={handleRestoreHistory}
        onClear={handleClearHistory}
      />

      <CrcProtocolNotesCard />
    </div>
  );
}

function createTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `crc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}