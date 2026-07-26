import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BuiltPart, DetailLevel, MaterialKey, PartDef, PartPiece } from '../parts/types';

const cache = new Map<string, BuiltPart>();

function triangleCount(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex();
  if (index) return index.count / 3;
  return geometry.attributes.position.count / 3;
}

/** Merge static pieces that share a material so each material costs one draw call. */
function mergeStatic(pieces: PartPiece[]): PartPiece[] {
  const groups = new Map<MaterialKey, PartPiece[]>();
  const output: PartPiece[] = [];

  for (const piece of pieces) {
    if (piece.movable) {
      output.push(piece);
      continue;
    }
    const group = groups.get(piece.material) ?? [];
    group.push(piece);
    groups.set(piece.material, group);
  }

  for (const [material, group] of groups) {
    if (group.length === 1) {
      output.push(group[0]);
      continue;
    }
    const merged = mergeGeometries(group.map((p) => p.geometry));
    if (!merged) throw new Error(`Failed to merge geometry for material "${material}"`);
    output.push({ name: `merged-${material}`, geometry: merged, material });
  }

  return output;
}

const SEGMENTS_FOR: Record<DetailLevel, number> = { high: 16, low: 8 };

export function buildPart<P extends object>(
  def: PartDef<P>,
  params?: Partial<P>,
  detail: DetailLevel = 'high',
): BuiltPart {
  const resolved = { ...def.defaultParams, ...params } as P;
  const cacheKey = `${def.id}:${detail}:${JSON.stringify(resolved)}`;

  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const raw = def.build(resolved, { detail, segments: SEGMENTS_FOR[detail] });
  const total = raw.reduce((sum, piece) => sum + triangleCount(piece.geometry), 0);
  const pieces = mergeStatic(raw);

  const built: BuiltPart = {
    pieces,
    triangleCount: total,
    drawCalls: pieces.length,
    detail,
    cacheKey,
  };
  cache.set(cacheKey, built);
  return built;
}

export function clearPartCache(): void {
  cache.clear();
}

export function partCacheSize(): number {
  return cache.size;
}
