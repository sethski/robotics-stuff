import { isSceneVisible } from '../design/balance';
import type { RobotDesign } from '../design/types';
import { useDesign } from '../state/DesignContext';

export interface RaceReadiness {
  hasChassis: boolean;
  hasWheels: boolean;
  ready: boolean;
}

export function assessRaceReadiness(design: RobotDesign): RaceReadiness {
  const hasChassis = design.parts.some(
    (p) => p.partId.startsWith('chassis') && isSceneVisible(p),
  );
  const hasWheels = design.parts.some(
    (p) => p.partId.startsWith('wheel') && isSceneVisible(p),
  );
  return { hasChassis, hasWheels, ready: hasChassis && hasWheels };
}

function ReadinessChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.85rem',
        background: ok ? '#1e3a2f' : '#3a2a1e',
        color: ok ? '#7dcea0' : '#d4a574',
        border: `1px solid ${ok ? '#2d5a45' : '#5a4030'}`,
      }}
    >
      {ok ? '✓' : '○'} {label}
    </span>
  );
}

export function RaceStub() {
  const { design } = useDesign();
  const { hasChassis, hasWheels, ready } = assessRaceReadiness(design);

  return (
    <section style={{ padding: '1.5rem' }}>
      <p style={{ marginBottom: '1rem', color: '#b8bcc4' }}>
        Race simulation arrives in the Race-mode plan.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <ReadinessChip ok={hasChassis} label="Chassis placed" />
        <ReadinessChip ok={hasWheels} label="Wheels placed" />
        <ReadinessChip ok={ready} label="Ready to race" />
      </div>
    </section>
  );
}
