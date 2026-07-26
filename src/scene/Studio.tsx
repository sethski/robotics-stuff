import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import type { ReactNode } from 'react';
import type { QualityTier } from './quality';

interface StudioProps {
  tier: QualityTier;
  children: ReactNode;
}

export function Studio({ tier, children }: StudioProps) {
  return (
    <>
      <hemisphereLight args={[0x9fc4ff, 0x2a2118, 0.6]} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} castShadow={tier === 'high'} />

      {tier !== 'low' && (
        // frames={1} bakes the environment once instead of every frame.
        <Environment frames={tier === 'high' ? Infinity : 1} resolution={tier === 'high' ? 256 : 128}>
          <Lightformer form="rect" intensity={3} color="white" scale={[6, 3]} position={[0, 4, 3]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.4} color="#9ec1ff" scale={[5, 3]} position={[-5, 1, 2]} target={[0, 0, 0]} />
          <Lightformer form="ring" intensity={2} color="#fff4e6" scale={[3, 3]} position={[3, 2, -4]} target={[0, 0, 0]} />
        </Environment>
      )}

      {children}

      {tier === 'high' && (
        <ContactShadows position={[0, -0.001, 0]} opacity={0.45} scale={1} blur={2.4} far={0.4} />
      )}
    </>
  );
}
