import { getPart } from '../parts/registry';
import type { MountSurface, SnapPoint } from '../parts/types';
import type { GridPlacement, PlacedPart, RobotDesign, SnapPlacement } from './types';

function rotatedFootprint(partId: string, rotationSteps: number): { cols: number; rows: number } {
  const fp = getPart(partId).footprint;
  if (rotationSteps % 2 === 1) return { cols: fp.rows, rows: fp.cols };
  return fp;
}

/** Snap hosts must be the root chassis or an already-placed part. */
export function isValidSnapHost(part: PlacedPart): boolean {
  if (part.partId === 'chassis-2wd' && part.placement === null) return true;
  return part.placement !== null;
}

function hostSurface(hostPartId: string, surfaceId: string, params: Record<string, number>): MountSurface {
  const def = getPart(hostPartId);
  const surfaces = def.surfaces;
  if (!surfaces?.length) throw new Error(`Part ${hostPartId} has no mount surfaces`);
  // Chassis rebuilds the grid from params in its def; for MVP read the static default surface
  // and recompute cols/rows if pitch/length present — keep simple: use def.surfaces[0] match by id.
  const surface = surfaces.find((s) => s.id === surfaceId);
  if (!surface) throw new Error(`Unknown surface ${surfaceId}`);
  void params;
  return surface;
}

export function occupiedCells(
  design: RobotDesign,
  hostInstanceId: string,
  surfaceId: string,
): Set<string> {
  const cells = new Set<string>();
  for (const part of design.parts) {
    const p = part.placement;
    if (!p || p.kind !== 'grid') continue;
    if (p.hostInstanceId !== hostInstanceId || p.surfaceId !== surfaceId) continue;
    const fp = rotatedFootprint(part.partId, p.rotationSteps);
    for (let c = 0; c < fp.cols; c += 1) {
      for (let r = 0; r < fp.rows; r += 1) {
        cells.add(`${p.col + c},${p.row + r}`);
      }
    }
  }
  return cells;
}

export function canPlaceGrid(
  design: RobotDesign,
  instanceId: string,
  hostInstanceId: string,
  surfaceId: string,
  col: number,
  row: number,
  rotationSteps: number,
): boolean {
  const part = design.parts.find((p) => p.instanceId === instanceId);
  const host = design.parts.find((p) => p.instanceId === hostInstanceId);
  if (!part || !host) return false;
  const fp = rotatedFootprint(part.partId, rotationSteps);
  if (fp.cols <= 0 || fp.rows <= 0) return false;
  const surface = hostSurface(host.partId, surfaceId, host.params);
  if (col < 0 || row < 0 || col + fp.cols > surface.cols || row + fp.rows > surface.rows) {
    return false;
  }
  // Ignore the instance's own cells when nudging.
  const ghost: RobotDesign = {
    ...design,
    parts: design.parts.map((p) =>
      p.instanceId === instanceId ? { ...p, placement: null } : p,
    ),
  };
  const used = occupiedCells(ghost, hostInstanceId, surfaceId);
  for (let c = 0; c < fp.cols; c += 1) {
    for (let r = 0; r < fp.rows; r += 1) {
      if (used.has(`${col + c},${row + r}`)) return false;
    }
  }
  return true;
}

export function placeOnGrid(
  design: RobotDesign,
  instanceId: string,
  hostInstanceId: string,
  surfaceId: string,
  col: number,
  row: number,
  rotationSteps: number,
): RobotDesign {
  if (!canPlaceGrid(design, instanceId, hostInstanceId, surfaceId, col, row, rotationSteps)) {
    throw new Error('Invalid grid placement');
  }
  const placement: GridPlacement = {
    kind: 'grid',
    hostInstanceId,
    surfaceId,
    col,
    row,
    rotationSteps,
  };
  return {
    ...design,
    parts: design.parts.map((p) => (p.instanceId === instanceId ? { ...p, placement } : p)),
    selectedInstanceId: instanceId,
  };
}

function snapById(partId: string, snapId: string): SnapPoint {
  const snap = getPart(partId).snaps.find((s) => s.id === snapId);
  if (!snap) throw new Error(`Unknown snap ${snapId} on ${partId}`);
  return snap;
}

export function canPlaceSnap(
  design: RobotDesign,
  instanceId: string,
  hostInstanceId: string,
  hostSnapId: string,
  partSnapId: string,
): boolean {
  const part = design.parts.find((p) => p.instanceId === instanceId);
  const host = design.parts.find((p) => p.instanceId === hostInstanceId);
  if (!part || !host || !isValidSnapHost(host)) return false;
  const a = snapById(part.partId, partSnapId);
  const b = snapById(host.partId, hostSnapId);
  if (a.type !== b.type) return false;
  const taken = design.parts.some(
    (p) =>
      p.instanceId !== instanceId &&
      p.placement?.kind === 'snap' &&
      p.placement.hostInstanceId === hostInstanceId &&
      p.placement.hostSnapId === hostSnapId,
  );
  return !taken;
}

export function placeOnSnap(
  design: RobotDesign,
  instanceId: string,
  hostInstanceId: string,
  hostSnapId: string,
  partSnapId: string,
): RobotDesign {
  if (!canPlaceSnap(design, instanceId, hostInstanceId, hostSnapId, partSnapId)) {
    throw new Error('Invalid snap placement');
  }
  const placement: SnapPlacement = {
    kind: 'snap',
    hostInstanceId,
    hostSnapId,
    partSnapId,
  };
  return {
    ...design,
    parts: design.parts.map((p) => (p.instanceId === instanceId ? { ...p, placement } : p)),
    selectedInstanceId: instanceId,
  };
}

export function nudgeGrid(
  design: RobotDesign,
  instanceId: string,
  dCol: number,
  dRow: number,
): RobotDesign {
  const part = design.parts.find((p) => p.instanceId === instanceId);
  if (!part || part.placement?.kind !== 'grid') return design;
  const { hostInstanceId, surfaceId, col, row, rotationSteps } = part.placement;
  return placeOnGrid(design, instanceId, hostInstanceId, surfaceId, col + dCol, row + dRow, rotationSteps);
}

export function listSnapTargets(
  design: RobotDesign,
  instanceId: string,
): Array<{ hostInstanceId: string; hostSnapId: string; partSnapId: string }> {
  const part = design.parts.find((p) => p.instanceId === instanceId);
  if (!part) return [];
  const partSnaps = getPart(part.partId).snaps;
  const out: Array<{ hostInstanceId: string; hostSnapId: string; partSnapId: string }> = [];
  for (const host of design.parts) {
    if (host.instanceId === instanceId || !isValidSnapHost(host)) continue;
    for (const hostSnap of getPart(host.partId).snaps) {
      for (const partSnap of partSnaps) {
        if (
          canPlaceSnap(design, instanceId, host.instanceId, hostSnap.id, partSnap.id)
        ) {
          out.push({
            hostInstanceId: host.instanceId,
            hostSnapId: hostSnap.id,
            partSnapId: partSnap.id,
          });
        }
      }
    }
  }
  return out;
}
