import { test, expect } from '@playwright/test';

test('simulate SEC standings and verify results render', async ({ page }) => {
  await page.goto('/cfb/sec', { waitUntil: 'networkidle' });

  await expect(page.getByTestId('conference-heading')).toBeVisible();
  await expect(page.getByTestId('standings-title')).toContainText('Current Standings');
  await expect(page.getByTestId('championship-matchup')).not.toBeVisible();

  const simulateBtn = page.getByTestId('simulate-button');
  await simulateBtn.scrollIntoViewIfNeeded();
  await simulateBtn.click();

  await expect(page.getByTestId('championship-matchup')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('standings-title')).toContainText('Simulated Standings');
  await expect(page.getByTestId('standings-title')).not.toContainText('Current Standings');

  await expect(page.getByTestId('share-section')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('share-url-input')).toHaveValue(/\/results\//);
});
