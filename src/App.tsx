import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { Studio } from './scene/Studio';
import { PartView } from './scene/PartView';

export default function App() {
  return (
    <Canvas
      style={{ width: '100vw', height: '100vh', background: '#16181d' }}
      shadows
      camera={{ position: [0.12, 0.09, 0.14], fov: 40 }}
      gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
    >
      <Studio tier="high">
        <PartView partId="hc-sr04" />
      </Studio>
      <OrbitControls makeDefault />
    </Canvas>
  );
}
