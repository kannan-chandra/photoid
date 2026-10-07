export interface CropTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface CropSnapshot {
  image: HTMLImageElement;
  sourceX: number;
  sourceY: number;
  sourceSize: number;
}

export class PhotoEditor {
  private readonly frame: HTMLElement;
  private readonly image: HTMLImageElement;
  private readonly zoom: HTMLInputElement;
  private readonly preview: HTMLCanvasElement;
  private naturalWidth = 0;
  private naturalHeight = 0;
  private minScale = 1;
  private transform: CropTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  private dragStart: { x: number; y: number; offsetX: number; offsetY: number } | null = null;

  constructor(frame: HTMLElement, image: HTMLImageElement, zoom: HTMLInputElement, preview: HTMLCanvasElement) {
    this.frame = frame;
    this.image = image;
    this.zoom = zoom;
    this.preview = preview;

    this.frame.addEventListener('pointerdown', this.onPointerDown);
    this.frame.addEventListener('pointermove', this.onPointerMove);
    this.frame.addEventListener('pointerup', this.onPointerUp);
    this.frame.addEventListener('pointercancel', this.onPointerUp);
    this.zoom.addEventListener('input', () => this.setZoom(Number(this.zoom.value)));
    new ResizeObserver(() => this.recalculate()).observe(this.frame);
  }

  async load(file: File): Promise<void> {
    const url = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      this.image.onload = () => resolve();
      this.image.onerror = () => reject(new Error('That image could not be opened.'));
      this.image.src = url;
    });
    URL.revokeObjectURL(url);
    this.naturalWidth = this.image.naturalWidth;
    this.naturalHeight = this.image.naturalHeight;
    this.transform.offsetX = 0;
    this.transform.offsetY = 0;
    this.recalculate(true);
  }

  getSnapshot(): CropSnapshot {
    const frameSize = this.frame.clientWidth;
    const renderedWidth = this.naturalWidth * this.transform.scale;
    const renderedHeight = this.naturalHeight * this.transform.scale;
    const left = (frameSize - renderedWidth) / 2 + this.transform.offsetX;
    const top = (frameSize - renderedHeight) / 2 + this.transform.offsetY;
    return {
      image: this.image,
      sourceX: -left / this.transform.scale,
      sourceY: -top / this.transform.scale,
      sourceSize: frameSize / this.transform.scale,
    };
  }

  private recalculate(resetZoom = false): void {
    if (!this.naturalWidth || !this.frame.clientWidth) return;
    const frameSize = this.frame.clientWidth;
    this.minScale = Math.max(frameSize / this.naturalWidth, frameSize / this.naturalHeight);
    if (resetZoom) {
      this.zoom.value = '1';
      this.transform.scale = this.minScale;
    } else {
      this.transform.scale = this.minScale * Number(this.zoom.value);
    }
    this.constrain();
    this.render();
  }

  private setZoom(multiplier: number): void {
    this.transform.scale = this.minScale * multiplier;
    this.constrain();
    this.render();
  }

  private constrain(): void {
    const frameSize = this.frame.clientWidth;
    const maxX = Math.max(0, (this.naturalWidth * this.transform.scale - frameSize) / 2);
    const maxY = Math.max(0, (this.naturalHeight * this.transform.scale - frameSize) / 2);
    this.transform.offsetX = Math.max(-maxX, Math.min(maxX, this.transform.offsetX));
    this.transform.offsetY = Math.max(-maxY, Math.min(maxY, this.transform.offsetY));
  }

  private render(): void {
    this.image.style.width = `${this.naturalWidth * this.transform.scale}px`;
    this.image.style.height = `${this.naturalHeight * this.transform.scale}px`;
    this.image.style.transform = `translate(-50%, -50%) translate(${this.transform.offsetX}px, ${this.transform.offsetY}px)`;
    this.renderPreview();
  }

  private renderPreview(): void {
    const context = this.preview.getContext('2d');
    if (!context) return;
    const crop = this.getSnapshot();
    context.clearRect(0, 0, this.preview.width, this.preview.height);
    context.drawImage(
      crop.image,
      crop.sourceX,
      crop.sourceY,
      crop.sourceSize,
      crop.sourceSize,
      0,
      0,
      this.preview.width,
      this.preview.height,
    );
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.frame.setPointerCapture(event.pointerId);
    this.dragStart = { x: event.clientX, y: event.clientY, offsetX: this.transform.offsetX, offsetY: this.transform.offsetY };
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.dragStart) return;
    this.transform.offsetX = this.dragStart.offsetX + event.clientX - this.dragStart.x;
    this.transform.offsetY = this.dragStart.offsetY + event.clientY - this.dragStart.y;
    this.constrain();
    this.render();
  };

  private onPointerUp = (): void => {
    this.dragStart = null;
  };
}
