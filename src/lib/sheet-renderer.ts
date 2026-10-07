import type { CropSnapshot } from './photo-editor';

export const SHEET_WIDTH = 1200;
export const SHEET_HEIGHT = 1800;
export const PHOTO_SIZE = 600;

export async function renderPassportSheet(crop: CropSnapshot): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = SHEET_WIDTH;
  canvas.height = SHEET_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Your browser could not create the print sheet.');

  context.fillStyle = '#fff';
  context.fillRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT);

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      context.drawImage(
        crop.image,
        crop.sourceX,
        crop.sourceY,
        crop.sourceSize,
        crop.sourceSize,
        column * PHOTO_SIZE,
        row * PHOTO_SIZE,
        PHOTO_SIZE,
        PHOTO_SIZE,
      );
    }
  }

  drawCutGuides(context);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.94));
  if (!blob) throw new Error('Your browser could not create the JPEG.');
  return setJpegDpi(blob, 300);
}

function drawCutGuides(context: CanvasRenderingContext2D): void {
  context.save();
  context.strokeStyle = 'rgba(255, 255, 255, .9)';
  context.lineWidth = 3;
  [PHOTO_SIZE].forEach((x) => {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, SHEET_HEIGHT); context.stroke();
  });
  [PHOTO_SIZE, PHOTO_SIZE * 2].forEach((y) => {
    context.beginPath(); context.moveTo(0, y); context.lineTo(SHEET_WIDTH, y); context.stroke();
  });
  context.strokeStyle = 'rgba(32, 42, 52, .8)';
  context.lineWidth = 1;
  [PHOTO_SIZE].forEach((x) => {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, SHEET_HEIGHT); context.stroke();
  });
  [PHOTO_SIZE, PHOTO_SIZE * 2].forEach((y) => {
    context.beginPath(); context.moveTo(0, y); context.lineTo(SHEET_WIDTH, y); context.stroke();
  });
  context.restore();
}

async function setJpegDpi(blob: Blob, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const isJfif = bytes.length > 18 && bytes[0] === 0xff && bytes[1] === 0xd8 &&
    String.fromCharCode(...bytes.slice(6, 11)) === 'JFIF\0';
  if (isJfif) {
    bytes[13] = 1;
    bytes[14] = (dpi >> 8) & 0xff;
    bytes[15] = dpi & 0xff;
    bytes[16] = (dpi >> 8) & 0xff;
    bytes[17] = dpi & 0xff;
  }
  return new Blob([bytes], { type: 'image/jpeg' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
