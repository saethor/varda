import { expect, test } from '@playwright/test';

// Needs the seeded persons and VARDA_DEV_MENU=true, both of which playwright.config.ts sets up.
test.use({ locale: 'en-GB' });

test('a developer switches between seeded persons from the dev menu', async ({ page }) => {
  const devMenu = page.getByLabel('Dev menu: signed in as');

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

  await devMenu.selectOption({ label: 'Anna Jónsdóttir · Athlete' });
  await expect(page.getByRole('heading', { name: 'Hi, Anna Jónsdóttir' })).toBeVisible();
  const url = page.url();

  await devMenu.selectOption({ label: 'Bjarni Sigurðsson · Athlete' });
  await expect(page.getByRole('heading', { name: 'Hi, Bjarni Sigurðsson' })).toBeVisible();
  expect(page.url()).toBe(url);
});
