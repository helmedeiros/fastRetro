import { test, expect } from '@playwright/test';

test('home page shows fastRetro heading', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /fastRetro/i }),
  ).toBeVisible();
});
