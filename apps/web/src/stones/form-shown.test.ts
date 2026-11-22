import { describe, expect, it } from 'vitest';
import type { Stone } from '../lib/stones.ts';
import { formShown, lapForm } from './form-shown.ts';

type Form = NonNullable<Stone['form']>;

const form: Form = { stepLength: 1.184, verticalOscillation: 0.0864, verticalRatio: 7.43, groundContactTime: 0.247 };

describe("a run's form", () => {
  it('shows each average the watch recorded, in order, in m, mm, % and ms', () => {
    expect(formShown(form, 'en')).toEqual([
      { key: 'stepLength', value: '1.18 m' },
      { key: 'verticalOscillation', value: '86 mm' },
      { key: 'verticalRatio', value: '7.4 %' },
      { key: 'groundContactTime', value: '247 ms' },
    ]);
  });

  it('leaves out an average the watch did not record, and shows nothing without form', () => {
    expect(formShown({ ...form, verticalRatio: null }, 'en').map(({ key }) => key)).toEqual([
      'stepLength',
      'verticalOscillation',
      'groundContactTime',
    ]);
    expect(formShown(null, 'en')).toEqual([]);
  });
});

describe("the laps' form", () => {
  it('has a column for each average some lap recorded, bare, a lap without it shown as none', () => {
    const laps = [{ form: { ...form, groundContactTime: null } }, { form: null }];

    expect(lapForm(laps, 'is')).toEqual([
      { key: 'stepLength', unit: 'm', values: ['1,18', null] },
      { key: 'verticalOscillation', unit: 'mm', values: ['86', null] },
      { key: 'verticalRatio', unit: '%', values: ['7,4', null] },
    ]);
  });

  it('has no columns when no lap recorded form', () => {
    expect(lapForm([{ form: null }, { form: null }], 'en')).toEqual([]);
  });
});
