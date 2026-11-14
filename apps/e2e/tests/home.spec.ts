import { expect, test } from '@playwright/test';

test.describe('in English', () => {
  test.use({ locale: 'en-GB' });

  test('the home page speaks English', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('One stone at a time.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sports' })).toBeVisible();
  });
});

test.describe('in Icelandic', () => {
  test.use({ locale: 'is-IS' });

  test('the home page speaks Icelandic', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Einn steinn í einu.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Íþróttir' })).toBeVisible();
  });
});
