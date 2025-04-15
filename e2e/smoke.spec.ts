import { test, expect } from '@playwright/test';

test('setup, persist, run icebreaker with rotating participant', async ({
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

  await page.reload();

  await expect(
    page.getByRole('list', { name: /participants/i }).getByText('Alice'),
  ).toHaveCount(0);
  await expect(
    page.getByRole('list', { name: /participants/i }).getByText('Bob'),
  ).toBeVisible();

  // Re-add Alice so we have two participants for the rotation.
  await input.fill('Alice');
  await addButton.click();

  await page.getByRole('button', { name: /start retro/i }).click();
  await expect(
    page.getByRole('heading', { name: /icebreaker/i }),
  ).toBeVisible();

  const remaining = page.getByTestId('time-remaining');
  await expect(remaining).toHaveText('10:00');

  const question = page.getByTestId('icebreaker-question');
  await expect(question).toBeVisible();
  const questionText = (await question.textContent()) ?? '';
  expect(questionText.length).toBeGreaterThan(0);

  const rotation = page.getByRole('list', { name: /icebreaker rotation/i });
  const firstCurrent = rotation.locator('li[data-current="true"]');
  await expect(firstCurrent).toHaveCount(1);
  const firstName = await firstCurrent.textContent();

  const nextButton = page.getByRole('button', { name: /^next$/i });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();

  const secondCurrent = rotation.locator('li[data-current="true"]');
  await expect(secondCurrent).toHaveCount(1);
  const secondName = await secondCurrent.textContent();
  expect(secondName).not.toBe(firstName);
  await expect(nextButton).toBeDisabled();

  await page.reload();

  await expect(
    page.getByRole('heading', { name: /icebreaker/i }),
  ).toBeVisible();
  await expect(question).toHaveText(questionText);
  await expect(
    rotation.locator('li[data-current="true"]'),
  ).toHaveText(secondName ?? '');
  await expect(page.getByRole('button', { name: /^next$/i })).toBeDisabled();
});
