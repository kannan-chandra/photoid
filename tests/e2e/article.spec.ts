import { expect, test } from '@playwright/test';

const photo = {
  name: 'article-photo.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800"><rect width="1000" height="800" fill="#287fa3"/><circle cx="500" cy="340" r="180" fill="#ffd8b5"/></svg>`),
};

test('renders the mock article with the creator embedded in place', async ({ page }) => {
  await page.goto('/article');
  await expect(page).toHaveTitle('How to Take a Passport Photo at Home');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /favicon\.svg$/);
  await expect(page.getByRole('heading', { name: 'How to take a passport photo at home' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Create your 2×2 photo' })).toBeVisible();

  const creator = page.locator('.photo-creator--embedded');
  await expect(creator.locator('.creator-step-one')).toBeVisible();
  await expect(creator.locator('.creator-step-two')).toBeHidden();
  await expect(creator.locator('.creator-step-three')).toBeHidden();
});

test('embedded creator replaces steps in place and supports back navigation', async ({ page }) => {
  await page.goto('/article');
  const creator = page.locator('.photo-creator--embedded');

  await creator.locator('[data-role="photo-input"]').setInputFiles(photo);
  await expect(creator.locator('.creator-step-one')).toBeHidden();
  await expect(creator.locator('.creator-step-two')).toBeVisible();
  await expect(creator.locator('.creator-step-three')).toBeHidden();
  await expect(creator.locator('[data-role="editor-image"]')).toHaveAttribute('src', /^blob:/);

  await creator.getByRole('button', { name: 'Back to choose photo' }).click();
  await expect(creator.locator('.creator-step-one')).toBeVisible();
  await expect(creator.locator('.creator-step-two')).toBeHidden();

  await creator.locator('[data-role="photo-input"]').setInputFiles(photo);
  await creator.getByRole('button', { name: 'Generate images' }).click();
  await expect(creator.locator('.creator-step-one')).toBeHidden();
  await expect(creator.locator('.creator-step-two')).toBeHidden();
  await expect(creator.locator('.creator-step-three')).toBeVisible();
  await expect(creator.locator('[data-preview="single"]')).toHaveAttribute('src', /^blob:/);
  await expect(creator.locator('[data-preview="six"]')).toHaveAttribute('src', /^blob:/);
  await expect(creator.locator('[data-preview="two"]')).toHaveAttribute('src', /^blob:/);

  await creator.getByRole('button', { name: 'Back to position photo' }).click();
  await expect(creator.locator('.creator-step-two')).toBeVisible();
  await expect(creator.locator('.creator-step-three')).toBeHidden();
});

test('embedded creator downloads a generated image', async ({ page }) => {
  await page.goto('/article');
  const creator = page.locator('.photo-creator--embedded');
  await creator.locator('[data-role="photo-input"]').setInputFiles(photo);
  await creator.getByRole('button', { name: 'Generate images' }).click();
  await expect(creator.locator('.creator-step-three')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await creator.locator('[data-format="single"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('passport-photo-600x600.jpg');
});
