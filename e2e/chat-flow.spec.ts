import { test, expect } from '@playwright/test';

test('chat drawer opens, sends message, streams response, and closes', async ({ page }) => {
  await page.goto('/cfb/sec', { waitUntil: 'networkidle' });

  const drawer = page.getByRole('dialog', { name: 'Chat' });
  await expect(drawer).not.toBeVisible();

  const searchBar = page.getByTestId('chat-trigger');
  await searchBar.fill('What does Alabama need to clinch?');
  await searchBar.press('Enter');

  await expect(drawer).toBeVisible();

  await expect(drawer.getByText('What does Alabama need to clinch?')).toBeVisible();

  const assistantBubble = drawer.locator('.chat-start .chat-bubble-received');
  await expect(assistantBubble.first()).toBeVisible({ timeout: 15_000 });
  await expect(assistantBubble.first()).not.toBeEmpty();

  await drawer.getByRole('button', { name: 'Close' }).click();
  await expect(drawer).not.toBeVisible();
});
