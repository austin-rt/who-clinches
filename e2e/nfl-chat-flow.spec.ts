import { test, expect } from '@playwright/test';

test('NFL chat search bar opens drawer and streams a response', async ({ page }) => {
  await page.goto('/nfl', { waitUntil: 'load' });

  const drawer = page.getByRole('dialog', { name: 'Chat' });
  await expect(drawer).not.toBeVisible();

  const searchBar = page.getByTestId('chat-trigger');
  await expect(searchBar).toBeVisible();
  await searchBar.fill('How do NFL tiebreakers work?');
  await searchBar.press('Enter');

  await expect(drawer).toBeVisible();

  await expect(drawer.getByText('How do NFL tiebreakers work?')).toBeVisible({
    timeout: 10_000,
  });

  const assistantBubble = drawer.locator('.chat-start .chat-bubble-received');
  await expect(assistantBubble.first()).toBeVisible({ timeout: 15_000 });
  await expect(assistantBubble.first()).not.toBeEmpty();

  await drawer.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(drawer).not.toBeVisible();
});

test('NFL chat search bar is present on team page', async ({ page }) => {
  await page.goto('/nfl/afc/north/bal', { waitUntil: 'load' });

  const searchBar = page.getByTestId('chat-trigger');
  await expect(searchBar).toBeVisible();
});
