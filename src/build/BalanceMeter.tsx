import { balanceScore, centreOfMass } from '../design/balance';
import { useDesign } from '../state/DesignContext';

export function BalanceMeter() {
  const { design } = useDesign();
  const score = balanceScore(design);
  const { totalMassKg } = centreOfMass(design);
  const pct = Math.round(score * 100);

  return (
    <div className="build-balance" aria-label="Balance meter">
      <span>{totalMassKg.toFixed(2)} kg</span>
      <div className="build-balance-meter" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="build-balance-fill" style={{ width: `${pct}%` }} />
      </div>
      <span>{pct}% off</span>
    </div>
  );
}
