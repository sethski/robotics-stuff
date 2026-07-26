import { getPart, PART_REGISTRY } from '../parts/registry';
import { useDesign } from '../state/DesignContext';

const parts = Object.values(PART_REGISTRY);

export function PartPalette() {
  const { design, addFromPalette, loadStarter, select } = useDesign();
  const unplaced = design.parts.filter((p) => p.placement === null && p.partId !== 'chassis-2wd');

  return (
    <aside className="build-palette" aria-label="Part palette">
      {parts.map((part) => (
        <button key={part.id} type="button" onClick={() => addFromPalette(part.id)}>
          {part.label}
        </button>
      ))}
      {unplaced.length > 0 && (
        <section className="build-palette-tray" aria-label="Unplaced parts">
          <h4 className="build-palette-tray-title">Unplaced</h4>
          {unplaced.map((p) => (
            <button
              key={p.instanceId}
              type="button"
              className="build-palette-tray-item"
              aria-current={design.selectedInstanceId === p.instanceId ? 'true' : undefined}
              onClick={() => select(p.instanceId)}
            >
              {getPart(p.partId).label}
            </button>
          ))}
        </section>
      )}
      <footer className="build-palette-footer">
        <button type="button" onClick={loadStarter}>
          Load starter robot
        </button>
      </footer>
    </aside>
  );
}
