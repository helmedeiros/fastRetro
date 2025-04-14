import { test, expect } from '@playwright/test';

test('setup, persist, start retro, and run the present timer', async ({
  page,
}) => {
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

  await expect(
    page.getByRole('list', { name: /participants/i }).getByText('Alice'),
  ).toBeVisible();
  await expect(
    page.getByRole('list', { name: /participants/i }).getByText('Bob'),
  ).toBeVisible();

  await page.getByRole('button', { name: /remove alice/i }).click();
  await expect(
    page.getByRole('list', { name: /participants/i }).getByText('Alice'),
  ).toHaveCount(0);
  await expect(
    page.getByRole('list', { name: /participants/i }).getByText('Bob'),
  ).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole('list', { name: /participants/i }).getByText('Alice'),
  ).toHaveCount(0);
  await expect(
    page.getByRole('list', { name: /participants/i }).getByText('Bob'),
  ).toBeVisible();

  // Start the retro and verify the present timer.
  await page.getByRole('button', { name: /start retro/i }).click();
  await expect(
    page.getByRole('heading', { name: /retro in progress/i }),
  ).toBeVisible();

  const remaining = page.getByTestId('time-remaining');
  await expect(remaining).toHaveText('10:00');

  await page.getByRole('button', { name: /^start$/i }).click();
  await expect(remaining).not.toHaveText('10:00', { timeout: 3000 });

  await page.getByRole('button', { name: /^pause$/i }).click();
  const pausedText = await remaining.textContent();

  await page.reload();

  await expect(
    page.getByRole('heading', { name: /retro in progress/i }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /^resume$/i })).toBeVisible();
  await expect(remaining).toHaveText(pausedText ?? '');
});
