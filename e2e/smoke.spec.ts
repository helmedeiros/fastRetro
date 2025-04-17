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

  await page
    .getByRole('button', { name: /continue to brainstorm/i })
    .click();
  await expect(
    page.getByRole('heading', { name: /brainstorm/i }),
  ).toBeVisible();
  await expect(page.getByTestId('time-remaining')).toHaveText('05:00');

  const startCol = page.getByRole('region', { name: /start column/i });
  const stopCol = page.getByRole('region', { name: /stop column/i });
  await startCol.getByLabel(/start card text/i).fill('ship faster');
  await startCol.getByRole('button', { name: /add start card/i }).click();
  await stopCol.getByLabel(/stop card text/i).fill('long meetings');
  await stopCol.getByRole('button', { name: /add stop card/i }).click();

  await expect(startCol.getByText('ship faster')).toBeVisible();
  await expect(stopCol.getByText('long meetings')).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole('heading', { name: /brainstorm/i }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: /start column/i })
      .getByText('ship faster'),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: /stop column/i })
      .getByText('long meetings'),
  ).toBeVisible();

  await page.getByRole('button', { name: /continue to vote/i }).click();
  await expect(page.getByRole('heading', { name: /^vote$/i })).toBeVisible();
  await expect(page.getByTestId('time-remaining')).toHaveText('05:00');

  const shipVoteBtn = page.getByRole('button', { name: /vote for ship faster/i });
  await shipVoteBtn.click();
  await shipVoteBtn.click();
  await expect(
    page.locator('[data-testid^="vote-count-"]').filter({ hasText: '★ 1' }),
  ).toHaveCount(0);
  await shipVoteBtn.click();
  await expect(
    page.locator('[data-testid^="vote-count-"]').filter({ hasText: '★ 1' }),
  ).toHaveCount(1);

  await page.reload();
  await expect(page.getByRole('heading', { name: /^vote$/i })).toBeVisible();
  await expect(
    page.locator('[data-testid^="vote-count-"]').filter({ hasText: '★ 1' }),
  ).toHaveCount(1);

  await page.getByRole('button', { name: /continue to discuss/i }).click();
  await expect(
    page.getByRole('heading', { name: /^discuss$/i }),
  ).toBeVisible();
  const activeCard = page.getByRole('region', { name: /active card/i });
  await expect(activeCard.getByText('ship faster')).toBeVisible();
  await expect(page.getByTestId('time-remaining')).toHaveText('02:30');

  const contextSection = page.getByRole('region', { name: /context notes/i });
  await contextSection
    .getByLabel(/context note text/i)
    .fill('we have CI flakes');
  await contextSection
    .getByRole('button', { name: /add context note/i })
    .click();
  await expect(contextSection.getByText('we have CI flakes')).toBeVisible();

  await page.getByRole('button', { name: /next segment/i }).click();
  const actionsSection = page.getByRole('region', { name: /actions notes/i });
  await actionsSection
    .getByLabel(/actions note text/i)
    .fill('fix flaky test in PaymentService');
  await actionsSection
    .getByRole('button', { name: /add actions note/i })
    .click();
  await expect(
    actionsSection.getByText('fix flaky test in PaymentService'),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('heading', { name: /^discuss$/i }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: /context notes/i })
      .getByText('we have CI flakes'),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: /actions notes/i })
      .getByText('fix flaky test in PaymentService'),
  ).toBeVisible();

  await page.getByRole('button', { name: /continue to review/i }).click();
  await expect(
    page.getByRole('heading', { name: /^review$/i }),
  ).toBeVisible();
  await expect(page.getByTestId('time-remaining')).toHaveText('05:00');
  const actionItems = page.getByRole('region', { name: /^action items$/i });
  await expect(
    actionItems.getByText('fix flaky test in PaymentService'),
  ).toBeVisible();
  await expect(actionItems.getByText('ship faster')).toBeVisible();

  const ownerSelect = page.getByLabel(
    /owner for fix flaky test in PaymentService/i,
  );
  await ownerSelect.selectOption({ label: 'Alice' });

  await page.reload();
  await expect(
    page.getByRole('heading', { name: /^review$/i }),
  ).toBeVisible();
  const ownerSelectAfter = page.getByLabel(
    /owner for fix flaky test in PaymentService/i,
  );
  await expect(ownerSelectAfter).toHaveValue(/.+/);
  const selectedLabel = await ownerSelectAfter.evaluate(
    (el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent ?? '',
  );
  expect(selectedLabel).toBe('Alice');

  await page.getByRole('button', { name: /continue to close/i }).click();
  await expect(
    page.getByRole('heading', { name: /retro complete/i }),
  ).toBeVisible();
  await expect(page.getByText('ship faster')).toBeVisible();
  await expect(
    page.getByText('fix flaky test in PaymentService'),
  ).toBeVisible();
  await expect(page.getByText(/owned by Alice/i)).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /export retro as json/i }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^fastretro-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const path = await download.path();
  expect(path).not.toBeNull();
  const fs = await import('node:fs');
  const raw = fs.readFileSync(path as string, 'utf-8');
  const parsed = JSON.parse(raw) as {
    version: number;
    participants: { id: string; name: string }[];
  };
  expect(parsed.version).toBe(1);
  expect(parsed.participants.map((p) => p.name).sort()).toEqual([
    'Alice',
    'Bob',
  ]);
});
