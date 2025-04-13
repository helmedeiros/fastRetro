import { test, expect } from '@playwright/test';

test('setup stage — add and remove participants', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /fastRetro/i }),
  ).toBeVisible();

  const input = page.getByLabel(/participant name/i);
  const addButton = page.getByRole('button', { name: /^add$/i });

  await input.fill('Alice');
  await addButton.click();
  await input.fill('Bob');
  await addButton.click();

  const list = page.getByRole('list', { name: /participants/i });
  await expect(list.getByText('Alice')).toBeVisible();
  await expect(list.getByText('Bob')).toBeVisible();

  await page.getByRole('button', { name: /remove alice/i }).click();

  await expect(list.getByText('Alice')).toHaveCount(0);
  await expect(list.getByText('Bob')).toBeVisible();
});
