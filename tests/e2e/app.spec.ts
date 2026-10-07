import { expect, test } from '@playwright/test';

test('shows the private local-photo starting experience', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Passport Photo Maker');
  await expect(page.getByRole('heading', { name: 'Passport photo maker' })).toBeVisible();
  await expect(page.getByText('Your photo stays on your device.')).toBeVisible();
  const input = page.locator('#photo-input');
  await expect(input).toHaveAttribute('accept', 'image/*');
  await expect(input).toHaveAttribute('capture', 'environment');
  await expect(page.getByText('Choose or take a photo')).toBeVisible();
});
