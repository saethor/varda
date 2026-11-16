import { describe, expect, it } from 'vitest';
import { paceOrSpeed } from './pace-or-speed.ts';

describe('pace or speed, the way each sport talks', () => {
  it('gives runners, walkers and hikers their pace per kilometre', () => {
    expect(paceOrSpeed('trail-running', 3000, 900, 'en')).toEqual({ measure: 'pace', value: '5:00 /km' });
    expect(paceOrSpeed('walking', 3000, 1800, 'en')).toEqual({ measure: 'pace', value: '10:00 /km' });
    expect(paceOrSpeed('hiking', 3000, 1800, 'en')).toEqual({ measure: 'pace', value: '10:00 /km' });
  });

  it('gives swimmers their pace per 100 metres', () => {
    expect(paceOrSpeed('swimming', 1500, 1575, 'en')).toEqual({ measure: 'pace', value: '1:45 /100 m' });
  });

  it('gives cyclists and skiers their speed', () => {
    expect(paceOrSpeed('cycling', 42_000, 6000, 'is')).toEqual({ measure: 'speed', value: '25,2 km/h' });
    expect(paceOrSpeed('skiing', 10_000, 3600, 'en')).toEqual({ measure: 'speed', value: '10.0 km/h' });
  });

  it('gives none for strength and other sessions, whose distance says little', () => {
    expect(paceOrSpeed('strength', 1000, 600, 'en')).toBeNull();
    expect(paceOrSpeed('other', 1000, 600, 'en')).toBeNull();
  });

  it('gives none without a distance or a moving time', () => {
    expect(paceOrSpeed('road-running', null, 900, 'en')).toBeNull();
    expect(paceOrSpeed('road-running', 3000, 0, 'en')).toBeNull();
  });
});
