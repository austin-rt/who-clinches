import { test, expect } from '@playwright/test';

test('invalid conference shows error page', async ({ page }) => {
  await page.goto('/cfb/fakeleague', { waitUntil: 'networkidle' });

  await expect(page.getByTestId('error-heading')).toBeVisible();
  await expect(page.getByTestId('error-message')).toContainText('fakeleague');
});

test('invalid sport shows error page', async ({ page }) => {
  await page.goto('/hockey/sec', { waitUntil: 'networkidle' });

  await expect(page.getByTestId('error-heading')).toBeVisible();
  await expect(page.getByTestId('error-message')).toContainText('hockey');
});
