import { test, expect } from '@playwright/test';

test('chat drawer opens, sends message, streams response, and closes', async ({ page }) => {
  await page.goto('/cfb/sec', { waitUntil: 'load' });

  const drawer = page.getByRole('dialog', { name: 'Chat' });
  await expect(drawer).not.toBeVisible();

  const searchBar = page.getByTestId('chat-trigger');
  await searchBar.fill('What does Alabama need to clinch?');
  await searchBar.press('Enter');

  await expect(drawer).toBeVisible();

  await expect(drawer.getByText('What does Alabama need to clinch?')).toBeVisible({
    timeout: 10_000,
  });

  const assistantBubble = drawer.locator('.chat-start .chat-bubble-received');
  await expect(assistantBubble.first()).toBeVisible({ timeout: 15_000 });
  await expect(assistantBubble.first()).not.toBeEmpty();

  await drawer.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(drawer).not.toBeVisible();
});

test('open chat drawer locks background scroll on mobile and restores position on close', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cfb/sec', { waitUntil: 'load' });

  const drawer = page.getByRole('dialog', { name: 'Chat' });
  await page.evaluate(() => window.scrollTo(0, 300));
  const scrollBeforeOpen = await page.evaluate(() => window.scrollY);
  expect(scrollBeforeOpen).toBeGreaterThan(0);
  await page.locator('.chat-search-send').dispatchEvent('click');
  await expect(drawer).toBeVisible();

  const locked = await page.evaluate(() => ({
    position: document.body.style.position,
    top: document.body.style.top,
  }));
  expect(locked.position).toBe('fixed');
  expect(locked.top).toBe(`-${scrollBeforeOpen}px`);

  await page.mouse.move(195, 400);
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await drawer.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(drawer).not.toBeVisible();

  expect(await page.evaluate(() => document.body.style.position)).toBe('');
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBeforeOpen);
});
