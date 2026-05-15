import { test, expect } from '@playwright/test';

test('chat drawer opens, sends message, streams response, and closes', async ({ page }) => {
  await page.goto('/cfb/sec', { waitUntil: 'networkidle' });

  const drawer = page.getByRole('dialog', { name: 'Chat' });
  await expect(drawer).not.toBeVisible();

  await page.getByTestId('chat-trigger').first().click();
  await expect(drawer).toBeVisible();

  const input = drawer.getByPlaceholder('How does Alabama make it?');
  await input.fill('What does Alabama need to clinch?');
  await drawer.getByRole('button', { name: 'Send' }).click();

  await expect(drawer.getByText('What does Alabama need to clinch?')).toBeVisible();
  await expect(input).toHaveValue('');

  await expect(drawer.getByText(/Based on the current standings/)).toBeVisible({ timeout: 15_000 });
  await expect(drawer.getByText(/specific scenarios/)).toBeVisible({ timeout: 15_000 });

  await drawer.getByRole('button', { name: 'Close' }).click();
  await expect(drawer).not.toBeVisible();
});
