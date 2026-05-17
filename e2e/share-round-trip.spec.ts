import { test, expect } from '@playwright/test';

test('share URL renders saved simulation results', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`PAGE_ERROR: ${err.message}`));
  page.on('response', (res) => {
    if (res.status() >= 400) errors.push(`HTTP ${res.status()} ${res.url()}`);
  });

  await page.goto('/cfb/sec', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('conference-heading')).toBeVisible();

  const simulateBtn = page.getByTestId('simulate-button');
  await expect(simulateBtn).toBeEnabled({ timeout: 15_000 });

  const responsePromise = page.waitForResponse((r) => r.url().includes('/api/simulate/'));
  await simulateBtn.click();
  const simulateResponse = await responsePromise;
  if (!simulateResponse.ok()) {
    const body = await simulateResponse.text().catch(() => '(unreadable)');
    console.error(`Simulate API failed: ${simulateResponse.status()} ${body}`);
  }

  try {
    await expect(page.getByTestId('championship-matchup')).toBeVisible({ timeout: 30_000 });
  } catch (e) {
    if (errors.length > 0) console.error('Collected errors:', errors.join('\n'));
    throw e;
  }
  await expect(page.getByTestId('share-section')).toBeVisible({ timeout: 30_000 });
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
