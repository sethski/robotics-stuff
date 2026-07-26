import type { PartDef } from './types';
import { battery } from './battery';
import { chassis } from './chassis';
import { irSensor } from './irSensor';
import { motor } from './motor';
import { ultrasonic } from './ultrasonic';
import { uno } from './uno';
import { wheel } from './wheel';

export const PART_REGISTRY = {
  [chassis.id]: chassis,
  [wheel.id]: wheel,
  [ultrasonic.id]: ultrasonic,
  [uno.id]: uno,
  [motor.id]: motor,
  [irSensor.id]: irSensor,
  [battery.id]: battery,
} as unknown as Record<string, PartDef<never>>;

export function getPart(id: string): PartDef<never> {
  const def = PART_REGISTRY[id];
  if (!def) throw new Error(`Unknown part id: ${id}`);
  return def;
}
