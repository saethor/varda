import { expect, type Page, test } from '@playwright/test';

/**
 * Answers the page's passkey prompts with Chromium's virtual authenticator, as a device's
 * fingerprint or PIN would: it keeps discoverable passkeys and verifies the person every time.
 *
 * The browser offers no passkey autofill: the virtual authenticator would answer the sign-in
 * screen's autofill offer by itself, at a moment of its choosing, racing the button under test.
 * Autofill is checked by hand in a real browser instead.
 */
async function useVirtualAuthenticator(page: Page) {
  await page.addInitScript(() => {
    PublicKeyCredential.isConditionalMediationAvailable = async () => false;
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

test.describe('in English', () => {
  test.use({ locale: 'en-GB' });

  test('a new person adds a passkey after signing up and signs in with it', async ({ page }) => {
    await useVirtualAuthenticator(page);
    const name = 'Bergþóra Skarphéðinsdóttir';
    // A unique email per run, so the database never needs resetting.
    const email = `bergthora-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

    await page.goto('/sign-up');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('a long enough password');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.getByRole('heading', { name: 'Add a passkey?' })).toBeVisible();
    await page.getByRole('button', { name: 'Add a passkey' }).click();
    await expect(page.getByRole('heading', { name: `Hi, ${name}` })).toBeVisible();

    await page.getByRole('link', { name: 'Settings' }).click();
    const signInMethods = page.getByRole('region', { name: 'Sign-in methods' });
    // Playwright's Desktop Chrome speaks as Chrome on Windows.
    await expect(signInMethods.getByRole('listitem')).toHaveText(['Password', /^Chrome on Windows\s*Added /]);
    await expect(signInMethods.getByRole('button', { name: /remove/i })).toHaveCount(0);

    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
    await expect(page.getByRole('heading', { name: `Hi, ${name}` })).toBeVisible();
  });
});
