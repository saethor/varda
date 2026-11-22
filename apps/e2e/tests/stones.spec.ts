import { expect, test } from '@playwright/test';
import { watchFile } from '@varda/record/watch-files';

// Needs the seeded persons and their stones, and VARDA_DEV_MENU=true, all of which
// playwright.config.ts sets up. The only runtime test across contexts (ADR 0005, ADR 0007).
test.use({ locale: 'en-GB' });

test('an athlete places a stone from a watch file, opens it and deletes it', async ({ page }) => {
  // A serial number no seeded watch has, so the session key never collides with the seed. The
  // file has no offset, so its local date is the UTC one: 36 hours ago keeps it before the
  // browser's today in any time zone, and inside the feed's first window of 4 weeks.
  const start = new Date(Math.floor((Date.now() - 36 * 60 * 60 * 1000) / 60_000) * 60_000);
  const fileName = 'e2e-morning-run.fit';
  const buffer = Buffer.from(watchFile({ serialNumber: 68_068_068, start }));

  await page.goto('/');
  await page.getByLabel('Dev menu: signed in as').selectOption({ label: 'Anna Jónsdóttir · Athlete' });
  await expect(page.getByRole('heading', { name: 'Hi, Anna Jónsdóttir' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Stones' }).click();
  await expect(page.getByRole('heading', { name: 'Stones' })).toBeVisible();

  await page
    .locator('input[type=file]')
    .setInputFiles({ name: fileName, mimeType: 'application/octet-stream', buffer });

  // The new stone opens on its own screen, saying it joined its week, with the file as provenance.
  await expect(page.getByRole('status')).toContainText(/^Placed\. Your \d+\w* stone/);
  await expect(page.getByText(`From your watch · ${fileName}`)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Road running' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Laps' })).toBeVisible();
  const stonePath = new URL(page.url()).pathname;
  expect(stonePath).toMatch(/^\/stones\/[0-9a-f-]{36}$/);

  // Back on the stones, it is in the feed.
  await page.locator('section').getByRole('link', { name: 'Stones', exact: true }).click();
  await expect(page).toHaveURL(/\/stones$/);
  const card = page.locator(`h3 a[href="${stonePath}"]`);
  await expect(card).toHaveText('Road running');

  await card.click();
  await expect(page).toHaveURL(stonePath);
  await page.getByRole('button', { name: 'Delete stone…' }).click();
  const modal = page.getByRole('alertdialog');
  await expect(modal.getByRole('heading', { name: 'Delete this stone?' })).toBeVisible();
  await modal.getByRole('button', { name: 'Delete stone', exact: true }).click();

  await expect(page).toHaveURL(/\/stones$/);
  await expect(page.getByText(`Stone deleted. You can place it again from ${fileName}.`)).toBeVisible();
  await expect(page.locator(`h3 a[href="${stonePath}"]`)).toHaveCount(0);

  await page.goto(stonePath);
  await expect(page.getByRole('heading', { name: 'Stone not found' })).toBeVisible();
});
