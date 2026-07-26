import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { Studio } from './scene/Studio';
import { RobotView } from './scene/RobotView';
import { DesignProvider, useDesign } from './state/DesignContext';
import { AppShell } from './shell/AppShell';
import { BuildHud } from './build/BuildHud';
import { CodeStub } from './shell/CodeStub';
import { RaceStub } from './shell/RaceStub';

function ModeBody() {
  const { mode } = useDesign();
  if (mode === 'code') return <CodeStub />;
  if (mode === 'race') return <RaceStub />;
  return (
    <>
      <Canvas
        style={{ position: 'absolute', inset: 0, background: '#16181d' }}
        shadows
        camera={{ position: [0.25, 0.2, 0.3], fov: 40 }}
        gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
      >
        <Studio tier="high">
          <RobotView />
        </Studio>
        <OrbitControls makeDefault />
      </Canvas>
      <BuildHud />
    </>
  );
}

export default function App() {
  return (
    <DesignProvider>
      <AppShell>
        <ModeBody />
      </AppShell>
    </DesignProvider>
  );
}
