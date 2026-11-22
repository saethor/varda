import { Trans } from '@lingui/react/macro';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@varda/ui/components/alert-dialog';
import { Button, buttonVariants } from '@varda/ui/components/button';
import { cn } from '@varda/ui/lib/utils';
import { SomethingWentWrongAlert } from '../components/form.tsx';
import { type Stone, useDeleteStone } from '../lib/stones.ts';

/** Deletes the stone and its watch file, once the athlete confirms it in a modal. */
export function DeleteStone({ stone, className }: { stone: Stone; className?: string }) {
  const deleting = useDeleteStone(stone);
  const fileName = stone.fileName;

  return (
    <div className={cn('flex flex-col items-end gap-3', className)}>
      {deleting.isError && <SomethingWentWrongAlert />}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={deleting.isPending}>
            <Trans>Delete stone…</Trans>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans>Delete this stone?</Trans>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans>
                The stone and its watch file, {fileName}, will be gone for good. You can place the stone again from the
                same file.
              </Trans>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Trans>Cancel</Trans>
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => deleting.mutate({ stoneId: stone.id })}
            >
              <Trans>Delete stone</Trans>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
