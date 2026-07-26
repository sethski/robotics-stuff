import * as THREE from 'three';

export const MATERIAL_KEYS = [
  'pcb',
  'metal',
  'gold',
  'dark',
  'plastic',
  'rubber',
  'mesh',
  'accent',
] as const;

export type MaterialKey = (typeof MATERIAL_KEYS)[number];

interface MaterialSpec {
  color: number;
  roughness: number;
  metalness: number;
}

/** Tier 2 values, tuned once here so no part ever defines its own material. */
const SPECS: Record<MaterialKey, MaterialSpec> = {
  pcb: { color: 0x1f4fa8, roughness: 0.55, metalness: 0.05 },
  metal: { color: 0xa9b0bb, roughness: 0.32, metalness: 0.85 },
  gold: { color: 0xc9a227, roughness: 0.28, metalness: 0.9 },
  dark: { color: 0x2a2d33, roughness: 0.8, metalness: 0.1 },
  plastic: { color: 0xd8dbe0, roughness: 0.65, metalness: 0.0 },
  rubber: { color: 0x1b1d21, roughness: 0.95, metalness: 0.0 },
  mesh: { color: 0x6b7078, roughness: 0.9, metalness: 0.2 },
  accent: { color: 0xe0603a, roughness: 0.5, metalness: 0.0 },
};

export function createPalette(): Record<MaterialKey, THREE.MeshStandardMaterial> {
  const palette = {} as Record<MaterialKey, THREE.MeshStandardMaterial>;
  for (const key of MATERIAL_KEYS) {
    const spec = SPECS[key];
    palette[key] = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: spec.roughness,
      metalness: spec.metalness,
    });
  }
  return palette;
}
