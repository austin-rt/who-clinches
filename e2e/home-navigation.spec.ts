import { test, expect } from '@playwright/test';

test('home page loads and navigates to conference page', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  await expect(page.getByTestId('home-heading')).toBeVisible();
  await expect(page.getByTestId('conference-grid')).toBeVisible();

  const secCard = page.getByTestId('conf-card-sec');
  await expect(secCard).toBeVisible();
  await secCard.click();

  await page.waitForURL('/cfb/sec');
  await expect(page.getByTestId('conference-heading')).toBeVisible();
  await expect(page.getByTestId('standings-title')).toContainText('Current Standings');
});
