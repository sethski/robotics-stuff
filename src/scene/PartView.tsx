import { useMemo } from 'react';
import { buildPart } from '../geometry/buildPart';
import { createPalette } from '../materials/palette';
import { getPart } from '../parts/registry';
import type { DetailLevel } from '../parts/types';

const GRID_PITCH = 0.00254;

export interface PartViewProps {
  partId: string;
  params?: Record<string, number>;
  detail?: DetailLevel;
}

function footprintBoxSize(partId: string): [number, number, number] {
  const { cols, rows } = getPart(partId).footprint;
  if (cols <= 0 || rows <= 0) {
    return [0.02, 0.02, 0.01];
  }
  return [cols * GRID_PITCH, rows * GRID_PITCH, 0.01];
}

export function PartView({ partId, params, detail = 'high' }: PartViewProps) {
  const palette = useMemo(() => createPalette(), []);
  const built = useMemo(() => {
    try {
      return { ok: true as const, value: buildPart(getPart(partId), params as never, detail) };
    } catch (error) {
      return { ok: false as const, error };
    }
  }, [partId, params, detail]);

  if (!built.ok) {
    console.warn(built.error);
    const [w, d, h] = footprintBoxSize(partId);
    return (
      <mesh>
        <boxGeometry args={[w, d, h]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    );
  }

  return (
    <group>
      {built.value.pieces.map((piece) => (
        <mesh
          key={piece.name}
          geometry={piece.geometry}
          material={palette[piece.material]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}

/** Alias for RobotView — build failures render a grey footprint box. */
export const SafePartView = PartView;
