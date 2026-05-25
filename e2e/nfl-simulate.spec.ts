import { test, expect } from '@playwright/test';

test('simulate NFL season and verify bracket renders', async ({ page }) => {
  await page.goto('/nfl', { waitUntil: 'load' });

  await expect(page.getByTestId('nfl-heading')).toBeVisible();
  await expect(page.getByTestId('nfl-bracket')).not.toBeVisible();

  const simulateBtn = page.getByTestId('simulate-button');
  await expect(simulateBtn).toBeEnabled({ timeout: 15_000 });
  await simulateBtn.scrollIntoViewIfNeeded();
  await simulateBtn.click();

  await expect(page.getByTestId('nfl-bracket')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('nfl-standings')).toBeVisible();
});

test('simulate NFL at conference level shows conference bracket', async ({ page }) => {
  await page.goto('/nfl/afc', { waitUntil: 'load' });

  const simulateBtn = page.getByTestId('simulate-button');
  await expect(simulateBtn).toBeEnabled({ timeout: 15_000 });
  await expect(simulateBtn).toContainText('Simulate AFC');
  await simulateBtn.scrollIntoViewIfNeeded();
  await simulateBtn.click();

  await expect(page.getByTestId('nfl-bracket')).toBeVisible({ timeout: 30_000 });
});

test('simulate button shows context-aware text', async ({ page }) => {
  await page.goto('/nfl', { waitUntil: 'load' });
  await expect(page.getByTestId('simulate-button')).toContainText('Simulate Season', {
    timeout: 15_000,
  });

  await page.goto('/nfl/nfc', { waitUntil: 'load' });
  await expect(page.getByTestId('simulate-button')).toContainText('Simulate NFC', {
    timeout: 15_000,
  });

  await page.goto('/nfl/afc/north', { waitUntil: 'load' });
  await expect(page.getByTestId('simulate-button')).toContainText('Simulate Division', {
    timeout: 15_000,
  });
});
