import { PART_REGISTRY } from '../parts/registry';
import { useDesign } from '../state/DesignContext';

const parts = Object.values(PART_REGISTRY);

export function PartPalette() {
  const { addFromPalette } = useDesign();

  return (
    <aside className="build-palette" aria-label="Part palette">
      {parts.map((part) => (
        <button key={part.id} type="button" onClick={() => addFromPalette(part.id)}>
          {part.label}
        </button>
      ))}
    </aside>
  );
}
