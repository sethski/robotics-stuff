import type { PartDef } from './types';
import { chassis } from './chassis';
import { wheel } from './wheel';
import { ultrasonic } from './ultrasonic';

export const PART_REGISTRY = {
  [chassis.id]: chassis,
  [wheel.id]: wheel,
  [ultrasonic.id]: ultrasonic,
} as unknown as Record<string, PartDef<never>>;

export function getPart(id: string): PartDef<never> {
  const def = PART_REGISTRY[id];
  if (!def) throw new Error(`Unknown part id: ${id}`);
  return def;
}
