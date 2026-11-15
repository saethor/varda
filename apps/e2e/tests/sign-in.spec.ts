import { expect, test } from '@playwright/test';

test.describe('in English', () => {
  test.use({ locale: 'en-GB' });

  test('a new person signs up, sees their name and signs out', async ({ page }) => {
    const name = 'Guðrún Ósvífursdóttir';
    // A unique email per run, so the database never needs resetting.
    const email = `gudrun-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await page.getByRole('link', { name: 'Sign up' }).click();
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('a long enough password');
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByRole('heading', { name: `Hi, ${name}` })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});

test.describe('in Icelandic', () => {
  test.use({ locale: 'is-IS' });

  test('sign-in speaks Icelandic', async ({ page }) => {
    await page.goto('/sign-in');

    await expect(page.getByRole('heading', { name: 'Innskráning' })).toBeVisible();
  });
});
