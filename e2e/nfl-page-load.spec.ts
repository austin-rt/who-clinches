import { test, expect } from '@playwright/test';

test('NFL page loads with games and filter nav', async ({ page }) => {
  await page.goto('/nfl', { waitUntil: 'load' });

  await expect(page.getByTestId('nfl-heading')).toBeVisible();
  await expect(page.getByTestId('nfl-heading')).toContainText('NFL');
  await expect(page.getByTestId('nfl-filter-nav')).toBeVisible();
  await expect(page.getByTestId('simulate-button')).toBeVisible({ timeout: 15_000 });
});

test('NFL filter navigates to conference page', async ({ page }) => {
  await page.goto('/nfl/afc', { waitUntil: 'load' });

  await expect(page.getByTestId('nfl-heading')).toContainText('AFC');
  await expect(page.getByTestId('simulate-button')).toBeVisible({ timeout: 15_000 });
});

test('NFL filter navigates to division page', async ({ page }) => {
  await page.goto('/nfl/afc/west', { waitUntil: 'load' });

  await expect(page.getByTestId('nfl-heading')).toContainText('AFC West');
  await expect(page.getByTestId('simulate-button')).toBeVisible({ timeout: 15_000 });
});

test('NFL filter navigates to team page', async ({ page }) => {
  await page.goto('/nfl/afc/west/kc', { waitUntil: 'load' });

  await expect(page.getByTestId('nfl-heading')).toContainText('Kansas City Chiefs');
  await expect(page.getByTestId('simulate-button')).toBeVisible({ timeout: 15_000 });
});

test('NFL invalid filter shows error', async ({ page }) => {
  await page.goto('/nfl/xyz', { waitUntil: 'load' });

  await expect(page.getByTestId('nfl-error-heading')).toBeVisible();
  await expect(page.getByTestId('nfl-error-heading')).toContainText('Page Not Found');
});
