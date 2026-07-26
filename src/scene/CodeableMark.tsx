import { Outlines } from '@react-three/drei';
import { getPart } from '../parts/registry';

interface CodeableMarkProps {
  active: boolean;
  partId: string;
  params?: Record<string, number>;
}

function outlineSize(partId: string, params: Record<string, number> = {}) {
  const def = getPart(partId);
  const merged = { ...def.defaultParams, ...params } as Record<string, number>;
  if ('boardWidth' in merged && 'boardHeight' in merged) {
    return {
      width: merged.boardWidth,
      height: merged.boardHeight,
      depth: merged.boardThickness ?? 0.002,
    };
  }
  return { width: 0.05, height: 0.05, depth: 0.01 };
}

/** Orange outline on programmable boards (Uno). */
export function CodeableMark({ active, partId, params }: CodeableMarkProps) {
  if (!active) return null;
  const { width, height, depth } = outlineSize(partId, params);
  return (
    <mesh position={[0, 0, depth / 2]}>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial visible={false} />
      <Outlines thickness={2} color="#e0603a" />
    </mesh>
  );
}
