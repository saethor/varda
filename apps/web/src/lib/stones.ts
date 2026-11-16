import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { type Month, monthOnScreen } from '../stones/calendar-month.ts';
import { feedWindow } from '../stones/feed-window.ts';
import type { LocalDate } from '../stones/local-date.ts';
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

/** Places a stone from a watch file, refreshes the stones loaded, and opens the new stone, saying it was placed. */
export function usePlaceStone() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation(
    orpc.record.stones.place.mutationOptions({
      onSuccess: async ({ stoneId }) => {
        await queryClient.invalidateQueries({ queryKey: orpc.record.stones.list.key() });
        await navigate({ to: '/stones/$stoneId', params: { stoneId }, state: { placed: true } });
      },
    }),
  );
}

/**
 * Deletes a stone and its recording, then goes back to the stones, saying which was deleted.
 * The stones loaded are fetched again first, so the deleted one never flashes up on the way back.
 */
export function useDeleteStone(stone: Pick<Stone, 'id' | 'fileName'>) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation(
    orpc.record.stones.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.record.stones.list.key(), refetchType: 'all' });
        await navigate({ to: '/stones', state: { deleted: stone.fileName } });
        // Only once its screen is gone, or the screen would ask for the stone again and be told it's not found.
        queryClient.removeQueries({ queryKey: orpc.record.stones.get.key({ input: { stoneId: stone.id } }) });
      },
    }),
  );
}

/** One stone, with its laps and trace. Fails with `NOT_FOUND` for one that doesn't exist or can't be seen. */
export const stoneQuery = (stoneId: string) => orpc.record.stones.get.queryOptions({ input: { stoneId } });

/** The signed-in person's stones in the month the calendar shows: its whole Mon–Sun weeks. */
export const calendarQuery = (month: Month) => orpc.record.stones.list.queryOptions({ input: monthOnScreen(month) });
