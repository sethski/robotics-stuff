import { useDesign } from '../state/DesignContext';
import { BalanceMeter } from './BalanceMeter';
import { PartPalette } from './PartPalette';
import { WiringPanel } from './WiringPanel';
import './build.css';

function NudgeControls() {
  const { design, nudge, rotateSelected } = useDesign();
  const selected = design.selectedInstanceId;
  const canNudge =
    selected !== null &&
    design.parts.find((p) => p.instanceId === selected)?.placement?.kind === 'grid';

  return (
    <div className="build-nudge" aria-label="Nudge controls">
      <div className="build-nudge-row">
        <button type="button" disabled={!canNudge} onClick={() => nudge(0, 1)} aria-label="Nudge up">
          ↑
        </button>
      </div>
      <div className="build-nudge-row">
        <button type="button" disabled={!canNudge} onClick={() => nudge(-1, 0)} aria-label="Nudge left">
          ←
        </button>
        <button type="button" disabled={!canNudge} onClick={() => nudge(1, 0)} aria-label="Nudge right">
          →
        </button>
      </div>
      <div className="build-nudge-row">
        <button type="button" disabled={!canNudge} onClick={() => nudge(0, -1)} aria-label="Nudge down">
          ↓
        </button>
      </div>
      <button type="button" disabled={!canNudge} onClick={() => rotateSelected(1)} aria-label="Rotate 90 degrees">
        ↻ 90°
      </button>
    </div>
  );
}

export function BuildHud() {
  const { mode } = useDesign();
  if (mode !== 'build') return null;

  return (
    <div className="build-hud">
      <PartPalette />
      <div className="build-bottom">
        <BalanceMeter />
        <NudgeControls />
      </div>
      <WiringPanel />
    </div>
  );
}
