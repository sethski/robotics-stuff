import type { ThreeEvent } from '@react-three/fiber';
import { getPart } from '../parts/registry';
import { worldPosition, worldQuaternion } from '../design/transforms';
import type { PlacedPart, RobotDesign } from '../design/types';
import { useDesign } from '../state/DesignContext';
import { CodeableMark } from './CodeableMark';
import { MountTargets } from './MountTargets';
import { PartView } from './PartView';

/** Parts shown in the scene: placed parts plus root chassis at origin. */
export function isPartVisible(part: PlacedPart): boolean {
  return part.placement !== null || part.partId === 'chassis-2wd';
}

export function visibleParts(design: RobotDesign): PlacedPart[] {
  return design.parts.filter(isPartVisible);
}

export function RobotView() {
  const { design, select, enterCodeFromBoard } = useDesign();

  return (
    <group>
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
            <PartView partId={p.partId} params={p.params} />
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
