import { test, expect } from '@playwright/test';

test('share URL renders saved simulation results', async ({ page }) => {
  await page.goto('/cfb/sec', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('conference-heading')).toBeVisible();

  const simulateBtn = page.getByTestId('simulate-button');
  await simulateBtn.scrollIntoViewIfNeeded();
  await simulateBtn.click();

  await expect(page.getByTestId('championship-matchup')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('share-section')).toBeVisible({ timeout: 10_000 });
  const shareInput = page.getByTestId('share-url-input');
  const shareUrl = await shareInput.inputValue();
  const resultsPath = new URL(shareUrl).pathname;
  expect(resultsPath).toMatch(/^\/results\/[A-Za-z0-9_-]+$/);

  await page.goto(resultsPath);

  await expect(page.getByTestId('results-heading')).toBeVisible();
  const tryItLink = page.getByTestId('results-try-it-link').first();
  await expect(tryItLink).toHaveAttribute('href', '/cfb/sec');
  await expect(page.getByTestId('championship-matchup')).toBeVisible();
  await expect(page.getByTestId('results-standings')).toBeVisible();
  await expect(page.getByTestId('results-games')).toBeVisible();
});
