import { type Sport, type SportGroup, sportGroupOf, sports } from '../domain/sport.ts';

export function listSports(): { sport: Sport; group: SportGroup }[] {
  return sports.map((sport) => ({ sport, group: sportGroupOf(sport) }));
}
