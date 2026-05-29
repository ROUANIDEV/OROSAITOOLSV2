import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  emptyWorkspaceState,
  loadWorkspaceStateFromDisk,
  usePersistWorkspaceStateToDisk,
  type WorkspaceState,
} from "@/app/workspace/workspacePersistence";
import { WORKSPACE_DATA_CLEARED_EVENT } from "@/features/settings";

type UseWorkspaceStateArgs = {
  onWorkspaceCleared?: () => void;
};

type UseWorkspaceStateResult = WorkspaceState & {
  workspaceStateLoaded: boolean;
  setCProjectState: Dispatch<SetStateAction<WorkspaceState["cProjectState"]>>;
  setCallTreeState: Dispatch<SetStateAction<WorkspaceState["callTreeState"]>>;
  setDataDictionaryState: Dispatch<
    SetStateAction<WorkspaceState["dataDictionaryState"]>
  >;
};

export function useWorkspaceState({
  onWorkspaceCleared,
}: UseWorkspaceStateArgs = {}): UseWorkspaceStateResult {
  const [workspaceStateLoaded, setWorkspaceStateLoaded] = useState(false);

  const [cProjectState, setCProjectState] = useState(
    emptyWorkspaceState.cProjectState,
  );
  const [callTreeState, setCallTreeState] = useState(
    emptyWorkspaceState.callTreeState,
  );
  const [dataDictionaryState, setDataDictionaryState] = useState(
    emptyWorkspaceState.dataDictionaryState,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceState() {
      const loadedState = await loadWorkspaceStateFromDisk();

      if (!isMounted) {
        return;
      }

      setCProjectState(loadedState.cProjectState);
      setCallTreeState(loadedState.callTreeState);
      setDataDictionaryState(loadedState.dataDictionaryState);
      setWorkspaceStateLoaded(true);
    }

    void loadWorkspaceState();

    return () => {
      isMounted = false;
    };
  }, []);

  const resetWorkspaceState = useCallback(() => {
    setCProjectState(emptyWorkspaceState.cProjectState);
    setCallTreeState(emptyWorkspaceState.callTreeState);
    setDataDictionaryState(emptyWorkspaceState.dataDictionaryState);
    setWorkspaceStateLoaded(true);
    onWorkspaceCleared?.();
  }, [onWorkspaceCleared]);

  useEffect(() => {
    window.addEventListener(WORKSPACE_DATA_CLEARED_EVENT, resetWorkspaceState);

    return () => {
      window.removeEventListener(
        WORKSPACE_DATA_CLEARED_EVENT,
        resetWorkspaceState,
      );
    };
  }, [resetWorkspaceState]);

  usePersistWorkspaceStateToDisk({
    cProjectState,
    callTreeState,
    dataDictionaryState,
    enabled: workspaceStateLoaded,
  });

  return {
    workspaceStateLoaded,
    cProjectState,
    callTreeState,
    dataDictionaryState,
    setCProjectState,
    setCallTreeState,
    setDataDictionaryState,
  };
}