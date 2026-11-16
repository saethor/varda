import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { type Month, monthOnScreen } from '../stones/calendar-month.ts';
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

/** One stone, with its laps and trace. Fails with `NOT_FOUND` for one that doesn't exist or can't be seen. */
export const stoneQuery = (stoneId: string) => orpc.record.stones.get.queryOptions({ input: { stoneId } });

/** The signed-in person's stones in the month the calendar shows: its whole Mon–Sun weeks. */
export const calendarQuery = (month: Month) => orpc.record.stones.list.queryOptions({ input: monthOnScreen(month) });
