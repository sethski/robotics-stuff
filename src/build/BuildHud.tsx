import { useDesign } from '../state/DesignContext';
import { listSnapTargets } from '../design/placement';
import { getPart } from '../parts/registry';
import { BalanceMeter } from './BalanceMeter';
import { PartPalette } from './PartPalette';
import { WiringPanel } from './WiringPanel';
import './build.css';

function SnapPlacementControls() {
  const { design, placeSnap } = useDesign();
  const selectedId = design.selectedInstanceId;
  if (!selectedId) return null;

  const selected = design.parts.find((p) => p.instanceId === selectedId);
  if (!selected || selected.placement !== null) return null;

  const targets = listSnapTargets(design, selectedId);
  if (targets.length === 0) return null;

  return (
    <div className="build-snap-targets" role="list" aria-label="Snap placement targets">
      <h4 className="build-snap-targets-title">Snap to</h4>
      {targets.map((t) => {
        const host = design.parts.find((p) => p.instanceId === t.hostInstanceId);
        const hostLabel = host ? getPart(host.partId).label : t.hostInstanceId;
        const label = `${hostLabel} · ${t.hostSnapId}`;
        return (
          <button
            key={`${t.hostInstanceId}:${t.hostSnapId}:${t.partSnapId}`}
            type="button"
            role="listitem"
            className="build-snap-target-btn"
            onClick={() =>
              placeSnap(selectedId, t.hostInstanceId, t.hostSnapId, t.partSnapId)
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

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
        <SnapPlacementControls />
        <NudgeControls />
      </div>
      <WiringPanel />
    </div>
  );
}
