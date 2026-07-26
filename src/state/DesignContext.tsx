import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createEmptyDesign,
  createStarterDesign,
  newInstanceId,
  syncInstanceIdCounter,
} from '../design/createDesign';
import {
  nudgeGrid,
  placeOnGrid,
  placeOnSnap,
} from '../design/placement';
import { autoAssignPins, reassignPin as reassignPinOnDesign } from '../design/pins';
import { loadDesign, mutateAndPersist, saveDesign } from '../design/persist';
import type { AppMode, BoardPinId, PlacedPart, RobotDesign } from '../design/types';

export interface DesignApi {
  design: RobotDesign;
  mode: AppMode;
  setMode: (m: AppMode) => void;
  select: (instanceId: string | null) => void;
  addFromPalette: (partId: string) => void;
  placeSnap: (
    instanceId: string,
    hostInstanceId: string,
    hostSnapId: string,
    partSnapId: string,
  ) => void;
  placeGrid: (
    instanceId: string,
    hostInstanceId: string,
    surfaceId: string,
    col: number,
    row: number,
    rotationSteps: number,
  ) => void;
  nudge: (dCol: number, dRow: number) => void;
  rotateSelected: (deltaSteps: number) => void;
  reassignPin: (partPinId: string, boardPin: BoardPinId) => void;
  autoAssign: () => void;
  save: () => void;
  load: () => void;
  enterCodeFromBoard: (instanceId: string) => void;
  loadStarter: () => void;
}

const DesignContext = createContext<DesignApi | null>(null);

function hydrateDesign(raw: RobotDesign): RobotDesign {
  syncInstanceIdCounter(raw);
  return raw;
}

function initialDesign(): RobotDesign {
  const loaded = loadDesign();
  return loaded ? hydrateDesign(loaded) : createEmptyDesign();
}

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesign] = useState<RobotDesign>(initialDesign);
  const [mode, setModeState] = useState<AppMode>('build');

  const commit = useCallback((mutate: (d: RobotDesign) => RobotDesign) => {
    setDesign((d) => mutateAndPersist(d, mutate));
  }, []);

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
  }, []);

  const select = useCallback((instanceId: string | null) => {
    setDesign((d) => ({ ...d, selectedInstanceId: instanceId }));
  }, []);

  const addFromPalette = useCallback(
    (partId: string) => {
      commit((d) => {
        if (partId === 'chassis-2wd' && d.parts.some((p) => p.partId === 'chassis-2wd')) {
          return d;
        }
        const instanceId = newInstanceId(partId);
        const part: PlacedPart = {
          instanceId,
          partId,
          params: {},
          placement: null,
          pinMap: {},
        };
        return {
          ...d,
          parts: [...d.parts, part],
          selectedInstanceId: instanceId,
        };
      });
    },
    [commit],
  );

  const placeSnap = useCallback(
    (
      instanceId: string,
      hostInstanceId: string,
      hostSnapId: string,
      partSnapId: string,
    ) => {
      commit((d) => {
        try {
          let next = placeOnSnap(d, instanceId, hostInstanceId, hostSnapId, partSnapId);
          next = autoAssignPins(next, instanceId);
          return next;
        } catch {
          return d;
        }
      });
    },
    [commit],
  );

  const placeGrid = useCallback(
    (
      instanceId: string,
      hostInstanceId: string,
      surfaceId: string,
      col: number,
      row: number,
      rotationSteps: number,
    ) => {
      commit((d) => {
        try {
          let next = placeOnGrid(
            d,
            instanceId,
            hostInstanceId,
            surfaceId,
            col,
            row,
            rotationSteps,
          );
          next = autoAssignPins(next, instanceId);
          return next;
        } catch {
          return d;
        }
      });
    },
    [commit],
  );

  const nudge = useCallback(
    (dCol: number, dRow: number) => {
      commit((d) => {
        const instanceId = d.selectedInstanceId;
        if (!instanceId) return d;
        try {
          return nudgeGrid(d, instanceId, dCol, dRow);
        } catch {
          return d;
        }
      });
    },
    [commit],
  );

  const rotateSelected = useCallback(
    (deltaSteps: number) => {
      commit((d) => {
        const instanceId = d.selectedInstanceId;
        if (!instanceId) return d;
        const part = d.parts.find((p) => p.instanceId === instanceId);
        if (!part || part.placement?.kind !== 'grid') return d;
        const { hostInstanceId, surfaceId, col, row, rotationSteps } = part.placement;
        const nextSteps = (rotationSteps + deltaSteps + 4) % 4;
        try {
          return placeOnGrid(d, instanceId, hostInstanceId, surfaceId, col, row, nextSteps);
        } catch {
          return d;
        }
      });
    },
    [commit],
  );

  const reassignPin = useCallback(
    (partPinId: string, boardPin: BoardPinId) => {
      commit((d) => {
        const instanceId = d.selectedInstanceId;
        if (!instanceId) return d;
        try {
          return reassignPinOnDesign(d, instanceId, partPinId, boardPin);
        } catch {
          return d;
        }
      });
    },
    [commit],
  );

  const autoAssign = useCallback(() => {
    commit((d) => {
      const instanceId = d.selectedInstanceId;
      if (!instanceId) return d;
      return autoAssignPins(d, instanceId);
    });
  }, [commit]);

  const save = useCallback(() => {
    setDesign((d) => {
      saveDesign(d);
      return d;
    });
  }, []);

  const load = useCallback(() => {
    const loaded = loadDesign();
    if (loaded) {
      const hydrated = hydrateDesign(loaded);
      saveDesign(hydrated);
      setDesign(hydrated);
    }
  }, []);

  const enterCodeFromBoard = useCallback(
    (instanceId: string) => {
      setDesign((d) => ({ ...d, selectedInstanceId: instanceId }));
      setModeState('code');
    },
    [],
  );

  const loadStarter = useCallback(() => {
    const starter = hydrateDesign(createStarterDesign());
    saveDesign(starter);
    setDesign(starter);
  }, []);

  const value = useMemo<DesignApi>(
    () => ({
      design,
      mode,
      setMode,
      select,
      addFromPalette,
      placeSnap,
      placeGrid,
      nudge,
      rotateSelected,
      reassignPin,
      autoAssign,
      save,
      load,
      enterCodeFromBoard,
      loadStarter,
    }),
    [
      design,
      mode,
      setMode,
      select,
      addFromPalette,
      placeSnap,
      placeGrid,
      nudge,
      rotateSelected,
      reassignPin,
      autoAssign,
      save,
      load,
      enterCodeFromBoard,
      loadStarter,
    ],
  );

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export function useDesign(): DesignApi {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error('useDesign must be used within DesignProvider');
  return ctx;
}
