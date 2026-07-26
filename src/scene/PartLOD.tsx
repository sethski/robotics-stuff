import { Detailed } from '@react-three/drei';
import { PartView } from './PartView';

interface PartLODProps {
  partId: string;
  params?: Record<string, number>;
  focusedId: string | null;
}

export function PartLOD({ partId, params, focusedId }: PartLODProps) {
  if (focusedId === partId) {
    return <PartView partId={partId} params={params} detail="high" />;
  }

  return (
    <Detailed distances={[0, 0.35]} hysteresis={0.15}>
      <PartView partId={partId} params={params} detail="high" />
      <PartView partId={partId} params={params} detail="low" />
    </Detailed>
  );
}
