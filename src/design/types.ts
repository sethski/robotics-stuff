export type BoardPinId =
  | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9' | 'D10' | 'D11' | 'D12' | 'D13'
  | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5'
  | '5V' | 'GND';

/** Snap attachment: part snap ↔ host snap (e.g. wheel → chassis shaft). */
export interface SnapPlacement {
  kind: 'snap';
  hostInstanceId: string;
  hostSnapId: string;
  partSnapId: string;
}

/** Grid attachment on a MountSurface (deck sensors, Uno, battery, motors). */
export interface GridPlacement {
  kind: 'grid';
  hostInstanceId: string;
  surfaceId: string;
  col: number;
  row: number;
  /** Quarter-turns about the surface normal. */
  rotationSteps: number;
}

export type Placement = SnapPlacement | GridPlacement;

export interface PlacedPart {
  instanceId: string;
  partId: string;
  params: Record<string, number>;
  placement: Placement | null;
  /** Part pin id → board pin id. Empty until assigned. */
  pinMap: Record<string, BoardPinId>;
}

export interface RobotDesign {
  version: 1;
  parts: PlacedPart[];
  selectedInstanceId: string | null;
}

export type AppMode = 'build' | 'code' | 'race';
