import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createEmptyDesign, newInstanceId } from '../design/createDesign';
import {
  nudgeGrid,
  placeOnGrid,
  placeOnSnap,
} from '../design/placement';
import { autoAssignPins, reassignPin as reassignPinOnDesign } from '../design/pins';
import { loadDesign, saveDesign } from '../design/persist';
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
}

const DesignContext = createContext<DesignApi | null>(null);

function initialDesign(): RobotDesign {
  return loadDesign() ?? createEmptyDesign();
}

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesign] = useState<RobotDesign>(initialDesign);
  const [mode, setModeState] = useState<AppMode>('build');

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
  }, []);

  const select = useCallback((instanceId: string | null) => {
    setDesign((d) => ({ ...d, selectedInstanceId: instanceId }));
  }, []);

  const addFromPalette = useCallback((partId: string) => {
    const instanceId = newInstanceId(partId);
    const part: PlacedPart = {
      instanceId,
      partId,
      params: {},
      placement: null,
      pinMap: {},
    };
    setDesign((d) => ({
      ...d,
      parts: [...d.parts, part],
      selectedInstanceId: instanceId,
    }));
  }, []);

  const placeSnap = useCallback(
    (
      instanceId: string,
      hostInstanceId: string,
      hostSnapId: string,
      partSnapId: string,
    ) => {
      setDesign((d) => {
        try {
          let next = placeOnSnap(d, instanceId, hostInstanceId, hostSnapId, partSnapId);
          next = autoAssignPins(next, instanceId);
          return next;
        } catch {
          return d;
        }
      });
    },
    [],
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
      setDesign((d) => {
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
    [],
  );

  const nudge = useCallback((dCol: number, dRow: number) => {
    setDesign((d) => {
      const instanceId = d.selectedInstanceId;
      if (!instanceId) return d;
      try {
        return nudgeGrid(d, instanceId, dCol, dRow);
      } catch {
        return d;
      }
    });
  }, []);

  const rotateSelected = useCallback((deltaSteps: number) => {
    setDesign((d) => {
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
  }, []);

  const reassignPin = useCallback((partPinId: string, boardPin: BoardPinId) => {
    setDesign((d) => {
      const instanceId = d.selectedInstanceId;
      if (!instanceId) return d;
      try {
        return reassignPinOnDesign(d, instanceId, partPinId, boardPin);
      } catch {
        return d;
      }
    });
  }, []);

  const autoAssign = useCallback(() => {
    setDesign((d) => {
      const instanceId = d.selectedInstanceId;
      if (!instanceId) return d;
      return autoAssignPins(d, instanceId);
    });
  }, []);

  const save = useCallback(() => {
    setDesign((d) => {
      saveDesign(d);
      return d;
    });
  }, []);

  const load = useCallback(() => {
    const loaded = loadDesign();
    if (loaded) setDesign(loaded);
  }, []);

  const enterCodeFromBoard = useCallback(
    (instanceId: string) => {
      setDesign((d) => ({ ...d, selectedInstanceId: instanceId }));
      setModeState('code');
    },
    [],
  );

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
    ],
  );

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export function useDesign(): DesignApi {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error('useDesign must be used within DesignProvider');
  return ctx;
}
