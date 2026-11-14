export const sportGroups = ['running', 'strength', 'cross-training'] as const;
export type SportGroup = (typeof sportGroups)[number];

const groupBySport = {
  'road-running': 'running',
  'trail-running': 'running',
  'track-running': 'running',
  'treadmill-running': 'running',
  strength: 'strength',
  cycling: 'cross-training',
  swimming: 'cross-training',
  skiing: 'cross-training',
  hiking: 'cross-training',
  walking: 'cross-training',
  other: 'cross-training',
} as const satisfies Record<string, SportGroup>;

export type Sport = keyof typeof groupBySport;
export const sports = Object.keys(groupBySport) as Sport[];

export function sportGroupOf(sport: Sport): SportGroup {
  return groupBySport[sport];
}
