const HEIC_EXTENSIONS = /\.(heic|heif)$/i;
const HEIC_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']);

export function isHeic(file: File): boolean {
  return HEIC_TYPES.has(file.type.toLowerCase()) || HEIC_EXTENSIONS.test(file.name);
}

export async function makeBrowserReadable(file: File): Promise<Blob> {
  if (!isHeic(file)) return file;

  try {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.94 });
    return Array.isArray(converted) ? converted[0] : converted;
  } catch {
    throw new Error('This HEIC photo could not be opened. Try exporting it as a JPEG and selecting it again.');
  }
}
