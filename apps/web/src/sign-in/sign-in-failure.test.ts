import { describe, expect, it } from 'vitest';
import { nothingFailed, type SignInEvent, signInFailure } from './sign-in-failure.ts';

/** The failure the sign-in screen shows after these events, or `null`. */
function shownAfter(...events: SignInEvent[]): Error | null {
  return events.reduce(signInFailure, nothingFailed).shown;
}

const notRecognised = new Error('That passkey is not recognised.');
const unreachable = new Error('Varða could not be reached.');

describe('signInFailure', () => {
  it('shows why signing in failed', () => {
    expect(shownAfter({ type: 'signInStarted' }, { type: 'signInFailed', error: notRecognised })).toBe(notRecognised);
  });

  it('stops showing a failure once the person tries again', () => {
    expect(
      shownAfter({ type: 'signInStarted' }, { type: 'signInFailed', error: notRecognised }, { type: 'signInStarted' }),
    ).toBeNull();
  });

  it('shows nothing when the autofill offer fails as the screen opens', () => {
    expect(shownAfter({ type: 'autofillOffered' }, { type: 'autofillFailed', error: unreachable })).toBeNull();
  });

  it('shows why signing in with a passkey picked from autofill failed', () => {
    expect(
      shownAfter(
        { type: 'autofillOffered' },
        { type: 'passkeyPickedFromAutofill' },
        { type: 'autofillFailed', error: unreachable },
      ),
    ).toBe(unreachable);
  });

  it('keeps showing why the passkey button failed when the autofill offer made again after it fails', () => {
    expect(
      shownAfter(
        { type: 'signInStarted' },
        { type: 'signInFailed', error: notRecognised },
        { type: 'autofillOffered' },
        { type: 'autofillFailed', error: unreachable },
      ),
    ).toBe(notRecognised);
  });
});
