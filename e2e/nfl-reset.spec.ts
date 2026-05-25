import { test, expect } from '@playwright/test';

test('reset clears NFL simulation results', async ({ page }) => {
  await page.goto('/nfl', { waitUntil: 'load' });

  const simulateBtn = page.getByTestId('simulate-button');
  await expect(simulateBtn).toBeEnabled({ timeout: 15_000 });
  await simulateBtn.scrollIntoViewIfNeeded();
  await simulateBtn.click();

  await expect(page.getByTestId('nfl-bracket')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('nfl-standings')).toBeVisible();

  const resetBtn = page.getByTestId('reset-button').first();
  await resetBtn.scrollIntoViewIfNeeded();
  await resetBtn.click();

  await expect(page.getByTestId('nfl-bracket')).not.toBeVisible();
  await expect(page.getByTestId('nfl-standings')).not.toBeVisible();
});
