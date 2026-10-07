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

test('loads, repositions, zooms, and previews a local photo', async ({ page }) => {
  await page.goto('/');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800"><rect width="1000" height="800" fill="#e33"/><circle cx="500" cy="340" r="180" fill="#fdc"/></svg>`;
  await page.locator('#photo-input').setInputFiles({ name: 'portrait.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });

  const editorSection = page.locator('#editor-section');
  await expect(editorSection).toBeVisible();
  await expect(page.getByRole('heading', { name: '2×2 preview' })).toBeVisible();

  const image = page.locator('#editor-image');
  await expect(image).toHaveAttribute('src', /^blob:/);
  const initialTransform = await image.evaluate((element) => element.style.transform);

  const frame = page.locator('#crop-frame');
  const box = await frame.boundingBox();
  if (!box) throw new Error('Crop frame has no bounds');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 35, box.y + box.height / 2 + 20);
  await page.mouse.up();
  await expect.poll(() => image.evaluate((element) => element.style.transform)).not.toBe(initialTransform);

  await page.locator('#zoom-input').fill('1.6');
  await expect.poll(() => image.evaluate((element) => element.style.width)).not.toBe('');
  const previewHasPixels = await page.locator('#crop-preview').evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d')!;
    return context.getImageData(150, 150, 1, 1).data[3] > 0;
  });
  expect(previewHasPixels).toBe(true);
});
