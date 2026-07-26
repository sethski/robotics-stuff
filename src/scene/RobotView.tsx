import type { ThreeEvent } from '@react-three/fiber';
import { getPart } from '../parts/registry';
import { worldPosition, worldQuaternion } from '../design/transforms';
import { isSceneVisible } from '../design/balance';
import type { PlacedPart, RobotDesign } from '../design/types';
import { useDesign } from '../state/DesignContext';
import { CodeableMark } from './CodeableMark';
import { MountTargets } from './MountTargets';
import { SafePartView } from './PartView';
import {
  ROBOT_RIDE_HEIGHT_M,
  ROBOT_SPACE_TO_WORLD_QUATERNION,
} from './robotSpaceAdapter';

export function visibleParts(design: RobotDesign): PlacedPart[] {
  return design.parts.filter(isSceneVisible);
}

export function RobotView() {
  const { design, select, enterCodeFromBoard } = useDesign();

  return (
    // Part/robot space is Z-up (PRD §7.1a); three.js/drei world is Y-up — see robotSpaceAdapter.
    <group
      position={[0, ROBOT_RIDE_HEIGHT_M, 0]}
      quaternion={ROBOT_SPACE_TO_WORLD_QUATERNION}
    >
      {visibleParts(design).map((p) => {
        const pos = worldPosition(design, p.instanceId);
        const quat = worldQuaternion(design, p.instanceId);
        const def = getPart(p.partId);

        const onClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (def.codeable) enterCodeFromBoard(p.instanceId);
          else select(p.instanceId);
        };

        return (
          <group
            key={p.instanceId}
            position={pos}
            quaternion={quat}
            onClick={onClick}
          >
            <SafePartView partId={p.partId} params={p.params} />
            {def.codeable && (
              <CodeableMark active partId={p.partId} params={p.params} />
            )}
          </group>
        );
      })}
      <MountTargets />
    </group>
  );
}
