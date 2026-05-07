import { test, expect } from '@playwright/test';

test('reset clears simulation results and picks', async ({ page }) => {
  await page.goto('/cfb/sec', { waitUntil: 'networkidle' });

  const simulateBtn = page.getByTestId('simulate-button');
  await simulateBtn.scrollIntoViewIfNeeded();
  await simulateBtn.click();

  await expect(page.getByTestId('championship-matchup')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('standings-title')).toContainText('Simulated');
  await expect(page.getByTestId('share-section')).toBeVisible({ timeout: 10_000 });

  const resetBtn = page.getByTestId('reset-button').first();
  await resetBtn.scrollIntoViewIfNeeded();
  await resetBtn.click();

  await expect(page.getByTestId('championship-matchup')).not.toBeVisible();
  await expect(page.getByTestId('standings-title')).toContainText('Current Standings');
  await expect(page.getByTestId('share-section')).not.toBeVisible();
});
