import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { canPlaceGrid, listSnapTargets } from '../design/placement';
import { worldPosition, worldQuaternion } from '../design/transforms';
import type { RobotDesign } from '../design/types';
import type { MountSurface } from '../parts/types';
import { getPart } from '../parts/registry';
import { useDesign } from '../state/DesignContext';

const SNAP_RADIUS = 0.02;

export function hostSnapWorldPosition(
  design: RobotDesign,
  hostInstanceId: string,
  hostSnapId: string,
): THREE.Vector3 {
  const host = design.parts.find((p) => p.instanceId === hostInstanceId);
  if (!host) return new THREE.Vector3();
  const snap = getPart(host.partId).snaps.find((s) => s.id === hostSnapId);
  if (!snap) return new THREE.Vector3();
  const local = new THREE.Vector3(...snap.position);
  return local
    .applyQuaternion(worldQuaternion(design, hostInstanceId))
    .add(worldPosition(design, hostInstanceId));
}

export function gridCellFromWorldPoint(
  hitLocal: THREE.Vector3,
  surface: MountSurface,
): { col: number; row: number } {
  const col = Math.round((hitLocal.x - surface.origin[0]) / surface.pitch);
  const row = Math.round((hitLocal.y - surface.origin[1]) / surface.pitch);
  return { col, row };
}

function DeckPlane({
  design,
  instanceId,
  hostInstanceId,
  surfaceId,
  surface,
  onPlace,
}: {
  design: RobotDesign;
  instanceId: string;
  hostInstanceId: string;
  surfaceId: string;
  surface: MountSurface;
  onPlace: (
    hostInstanceId: string,
    surfaceId: string,
    col: number,
    row: number,
  ) => void;
}) {
  const hostPos = worldPosition(design, hostInstanceId);
  const hostQuat = worldQuaternion(design, hostInstanceId);
  const width = surface.cols * surface.pitch;
  const height = surface.rows * surface.pitch;
  const centerX = surface.origin[0] + ((surface.cols - 1) * surface.pitch) / 2;
  const centerY = surface.origin[1] + ((surface.rows - 1) * surface.pitch) / 2;
  const z = surface.origin[2] + 0.0005;

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const hostGroup = e.eventObject.parent;
    if (!hostGroup) return;
    const hitLocal = hostGroup.worldToLocal(e.point.clone());
    const { col, row } = gridCellFromWorldPoint(hitLocal, surface);
    if (canPlaceGrid(design, instanceId, hostInstanceId, surfaceId, col, row, 0)) {
      onPlace(hostInstanceId, surfaceId, col, row);
    }
  };

  return (
    <group position={hostPos} quaternion={hostQuat}>
      <mesh position={[centerX, centerY, z]} onPointerDown={onPointerDown}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          color="#4a90d9"
          transparent
          opacity={0.18}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function MountTargets() {
  const { design, placeSnap, placeGrid } = useDesign();
  const instanceId = design.selectedInstanceId;
  if (!instanceId) return null;

  const selected = design.parts.find((p) => p.instanceId === instanceId);
  if (!selected || selected.placement !== null) return null;

  const snapTargets = listSnapTargets(design, instanceId);
  const fp = getPart(selected.partId).footprint;
  const showGrid = fp.cols > 0 && fp.rows > 0;

  const gridSurfaces: Array<{
    hostInstanceId: string;
    surfaceId: string;
    surface: MountSurface;
  }> = [];
  if (showGrid) {
    for (const host of design.parts) {
      const surfaces = getPart(host.partId).surfaces;
      if (!surfaces?.length) continue;
      for (const surface of surfaces) {
        gridSurfaces.push({
          hostInstanceId: host.instanceId,
          surfaceId: surface.id,
          surface,
        });
      }
    }
  }

  return (
    <group>
      {snapTargets.map((t) => {
        const pos = hostSnapWorldPosition(design, t.hostInstanceId, t.hostSnapId);
        return (
          <mesh
            key={`${t.hostInstanceId}:${t.hostSnapId}:${t.partSnapId}`}
            position={pos}
            onPointerDown={(e) => {
              e.stopPropagation();
              placeSnap(instanceId, t.hostInstanceId, t.hostSnapId, t.partSnapId);
            }}
          >
            <sphereGeometry args={[SNAP_RADIUS, 16, 16]} />
            <meshBasicMaterial color="#5fd38d" transparent opacity={0.75} />
          </mesh>
        );
      })}
      {gridSurfaces.map(({ hostInstanceId, surfaceId, surface }) => (
        <DeckPlane
          key={`${hostInstanceId}:${surfaceId}`}
          design={design}
          instanceId={instanceId}
          hostInstanceId={hostInstanceId}
          surfaceId={surfaceId}
          surface={surface}
          onPlace={(h, s, col, row) => placeGrid(instanceId, h, s, col, row, 0)}
        />
      ))}
    </group>
  );
}
