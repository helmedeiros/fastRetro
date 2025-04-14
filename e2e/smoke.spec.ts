import { test, expect } from '@playwright/test';

test('setup stage — participants persist across reloads', async ({ page }) => {
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

  await page.reload();

  const listAfterReload = page.getByRole('list', { name: /participants/i });
  await expect(listAfterReload.getByText('Alice')).toBeVisible();
  await expect(listAfterReload.getByText('Bob')).toBeVisible();

  await page.getByRole('button', { name: /remove alice/i }).click();
  await expect(listAfterReload.getByText('Alice')).toHaveCount(0);
  await expect(listAfterReload.getByText('Bob')).toBeVisible();

  await page.reload();

  const listAfterSecondReload = page.getByRole('list', {
    name: /participants/i,
  });
  await expect(listAfterSecondReload.getByText('Alice')).toHaveCount(0);
  await expect(listAfterSecondReload.getByText('Bob')).toBeVisible();
});
