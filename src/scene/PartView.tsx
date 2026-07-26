import { useMemo } from 'react';
import { buildPart } from '../geometry/buildPart';
import { createPalette } from '../materials/palette';
import { getPart } from '../parts/registry';

interface PartViewProps {
  partId: string;
  params?: Record<string, number>;
}

export function PartView({ partId, params }: PartViewProps) {
  const palette = useMemo(() => createPalette(), []);
  const built = useMemo(() => buildPart(getPart(partId), params as never), [partId, params]);

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
