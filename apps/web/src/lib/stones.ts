import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feedWindow, type LocalDate } from '../stones/feed-window.ts';
import { type client, orpc } from './orpc.ts';

/** A stone as the contract shows it. */
export type Stone = Awaited<ReturnType<typeof client.record.stones.list>>[number];
export type Sport = Stone['sport']['sport'];

/** The signed-in person's stones, 4 weeks at a time back from `today`, newest first. */
export const feedQuery = (today: LocalDate) =>
  orpc.record.stones.list.infiniteOptions({
    input: (window: number) => feedWindow(today, window),
    initialPageParam: 0,
    // There is always an earlier window; it may hold no stones.
    getNextPageParam: (_last, windows) => windows.length,
  });

/** Places a stone from a watch file, and refreshes the feed once it is placed. */
export function usePlaceStone() {
  const queryClient = useQueryClient();
  return useMutation(
    orpc.record.stones.place.mutationOptions({
      onSuccess: async () => await queryClient.invalidateQueries({ queryKey: orpc.record.stones.list.key() }),
    }),
  );
}
