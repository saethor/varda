import {
  formatGroundContactTime,
  formatStepLength,
  formatVerticalOscillation,
  formatVerticalRatio,
  type UnitOption,
  units,
} from '@varda/ui/lib/format';
import type { Stone } from '../lib/stones.ts';
import type { ValueFormat } from './figures-shown.ts';

type Form = NonNullable<Stone['form']>;
export type FormKey = keyof Form;

// The order the form averages are shown in, as the watch shows them.
const order: FormKey[] = ['stepLength', 'verticalOscillation', 'verticalRatio', 'groundContactTime'];

const formats: Record<FormKey, ValueFormat> = {
  stepLength: { format: formatStepLength, unit: units.stepLength },
  verticalOscillation: { format: formatVerticalOscillation, unit: units.verticalOscillation },
  verticalRatio: { format: formatVerticalRatio, unit: units.verticalRatio },
  groundContactTime: { format: formatGroundContactTime, unit: units.groundContactTime },
};

/** One form average as the screen shows it: m, mm, % or ms, with or without its unit. */
export function formatForm(key: FormKey, value: number, locale: string, options: UnitOption = {}): string {
  return formats[key].format(value, locale, options);
}

/** The form averages the watch recorded, in order, each formatted; one it didn't record is left out. */
export function formShown(form: Form | null, locale: string): { key: FormKey; value: string }[] {
  if (form === null) return [];
  return order.flatMap((key) => {
    const value = form[key];
    return value === null ? [] : [{ key, value: formatForm(key, value, locale) }];
  });
}

/** A form column of the laps' form table: its unit for the head, and each lap's bare value, or none. */
export type LapFormColumn = { key: FormKey; unit: string; values: (string | null)[] };

/** A column for each form average some lap recorded, in order; one no lap recorded is left out. */
export function lapForm(laps: Pick<Stone['laps'][number], 'form'>[], locale: string): LapFormColumn[] {
  return order.flatMap((key) => {
    const values = laps.map(({ form }) => {
      const value = form?.[key] ?? null;
      return value === null ? null : formatForm(key, value, locale, { unit: false });
    });
    return values.every((value) => value === null) ? [] : [{ key, unit: formats[key].unit, values }];
  });
}
