import * as THREE from 'three';
import { getPart } from '../parts/registry';
import type { MountSurface } from '../parts/types';
import type { RobotDesign } from './types';

function findPart(design: RobotDesign, instanceId: string) {
  const part = design.parts.find((p) => p.instanceId === instanceId);
  if (!part) throw new Error(`Unknown instance: ${instanceId}`);
  return part;
}

function hostSurface(hostPartId: string, surfaceId: string, params: Record<string, number>): MountSurface {
  const def = getPart(hostPartId);
  const surfaces = def.surfaces;
  if (!surfaces?.length) throw new Error(`Part ${hostPartId} has no mount surfaces`);
  const surface = surfaces.find((s) => s.id === surfaceId);
  if (!surface) throw new Error(`Unknown surface ${surfaceId}`);
  void params;
  return surface;
}

function snapById(partId: string, snapId: string) {
  const snap = getPart(partId).snaps.find((s) => s.id === snapId);
  if (!snap) throw new Error(`Unknown snap ${snapId} on ${partId}`);
  return snap;
}

const Z_AXIS = new THREE.Vector3(0, 0, 1);

export function worldPosition(design: RobotDesign, instanceId: string): THREE.Vector3 {
  const part = findPart(design, instanceId);
  const placement = part.placement;

  if (!placement) {
    return new THREE.Vector3(0, 0, 0);
  }

  if (placement.kind === 'snap') {
    const host = findPart(design, placement.hostInstanceId);
    const hostPos = worldPosition(design, host.instanceId);
    const hostSnap = snapById(host.partId, placement.hostSnapId);
    const partSnap = snapById(part.partId, placement.partSnapId);
    return hostPos
      .clone()
      .add(new THREE.Vector3(...hostSnap.position))
      .sub(new THREE.Vector3(...partSnap.position));
  }

  const host = findPart(design, placement.hostInstanceId);
  const surface = hostSurface(host.partId, placement.surfaceId, host.params);
  const local = new THREE.Vector3(
    surface.origin[0] + placement.col * surface.pitch,
    surface.origin[1] + placement.row * surface.pitch,
    surface.origin[2],
  );
  return local.applyMatrix4(worldMatrix(design, host.instanceId));
}

export function worldQuaternion(design: RobotDesign, instanceId: string): THREE.Quaternion {
  const part = findPart(design, instanceId);
  const placement = part.placement;

  if (!placement) {
    return new THREE.Quaternion();
  }

  const hostQuat = worldQuaternion(design, placement.hostInstanceId);

  if (placement.kind === 'grid') {
    const localRot = new THREE.Quaternion().setFromAxisAngle(
      Z_AXIS,
      placement.rotationSteps * (Math.PI / 2),
    );
    return hostQuat.clone().multiply(localRot);
  }

  return hostQuat.clone();
}

export function worldMatrix(design: RobotDesign, instanceId: string): THREE.Matrix4 {
  const matrix = new THREE.Matrix4();
  matrix.compose(
    worldPosition(design, instanceId),
    worldQuaternion(design, instanceId),
    new THREE.Vector3(1, 1, 1),
  );
  return matrix;
}
