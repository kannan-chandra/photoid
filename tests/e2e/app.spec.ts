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

test('accepts a photo dropped onto the upload area', async ({ page }) => {
  await page.goto('/');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100"><rect width="900" height="1100" fill="#3a7"/></svg>`;
  const dataTransfer = await page.evaluateHandle((contents) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([contents], 'dropped-photo.svg', { type: 'image/svg+xml' }));
    return transfer;
  }, svg);
  await page.locator('#drop-zone').dispatchEvent('dragover', { dataTransfer });
  await expect(page.locator('#drop-zone')).toHaveClass(/is-dragging/);
  await page.locator('#drop-zone').dispatchEvent('drop', { dataTransfer });
  await expect(page.locator('#editor-section')).toBeVisible();
  await expect(page.locator('#drop-zone')).not.toHaveClass(/is-dragging/);
  await expect(page.locator('#editor-image')).toHaveAttribute('src', /^blob:/);
});

test('downloads a 1200 by 1800 JPEG print sheet', async ({ page }) => {
  await page.goto('/');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="1200" height="900" fill="#247ba0"/><circle cx="600" cy="400" r="220" fill="#ffe0bd"/></svg>`;
  await page.locator('#photo-input').setInputFiles({ name: 'portrait.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
  await expect(page.locator('#download-button')).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-button').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('passport-photos-4x6.jpg');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const jpeg = Buffer.concat(chunks);
  expect(jpeg.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
  expect(readJpegDimensions(jpeg)).toEqual({ width: 1200, height: 1800 });
  expect(jpeg.length).toBeGreaterThan(20_000);
});

function readJpegDimensions(buffer: Buffer): { width: number; height: number } {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  throw new Error('JPEG dimensions were not found');
}
