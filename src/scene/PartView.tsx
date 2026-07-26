import { useMemo } from 'react';
import { buildPart } from '../geometry/buildPart';
import { createPalette } from '../materials/palette';
import { getPart } from '../parts/registry';
import type { DetailLevel } from '../parts/types';

interface PartViewProps {
  partId: string;
  params?: Record<string, number>;
  detail?: DetailLevel;
}

export function PartView({ partId, params, detail = 'high' }: PartViewProps) {
  const palette = useMemo(() => createPalette(), []);
  const built = useMemo(
    () => buildPart(getPart(partId), params as never, detail),
    [partId, params, detail],
  );

  return (
    <group>
      {built.pieces.map((piece) => (
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
