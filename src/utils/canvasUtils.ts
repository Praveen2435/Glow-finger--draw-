export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface GlowStrokeOptions {
  color: string;
  brushSize: number;
  glowIntensity: number;
}

/** Convert normalized MediaPipe coords to canvas pixel coords (mirrored X) */
export function toCanvasCoords(
  normX: number,
  normY: number,
  canvasWidth: number,
  canvasHeight: number
): Point {
  return {
    x: (1 - normX) * canvasWidth,
    y: normY * canvasHeight,
  };
}

/** Euclidean distance between two points */
export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Weighted moving average smoothing */
export function wmaSmooth(
  points: Point[],
  windowSize: number = 5
): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const len = Math.min(points.length, windowSize);
  const slice = points.slice(-len);
  let totalWeight = 0;
  let wx = 0;
  let wy = 0;
  slice.forEach((p, i) => {
    const weight = i + 1;
    wx += p.x * weight;
    wy += p.y * weight;
    totalWeight += weight;
  });
  return { x: wx / totalWeight, y: wy / totalWeight };
}

/** Draw a 3-layer glow stroke using quadratic bezier curves */
export function drawGlowStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  options: GlowStrokeOptions
): void {
  if (points.length < 2) return;

  const { color, brushSize, glowIntensity } = options;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Layer 1: Outer glow — large blur, low opacity
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = brushSize * 4;
  ctx.shadowBlur = glowIntensity * 3;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  drawBezierPath(ctx, points);

  // Layer 2: Mid glow — medium blur
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = brushSize * 2;
  ctx.shadowBlur = glowIntensity * 1.5;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  drawBezierPath(ctx, points);

  // Layer 3: Inner sharp bright stroke
  ctx.globalAlpha = 1.0;
  ctx.lineWidth = brushSize;
  ctx.shadowBlur = glowIntensity * 0.5;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  drawBezierPath(ctx, points);

  ctx.restore();
}

function drawBezierPath(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

/** Draw a single segment between two points with glow */
export function drawGlowSegment(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  options: GlowStrokeOptions
): void {
  const { color, brushSize, glowIntensity } = options;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer glow
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = brushSize * 4;
  ctx.shadowBlur = glowIntensity * 3;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Mid glow
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = brushSize * 2;
  ctx.shadowBlur = glowIntensity * 1.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Inner sharp
  ctx.globalAlpha = 1.0;
  ctx.lineWidth = brushSize;
  ctx.shadowBlur = glowIntensity * 0.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.restore();
}

/** Create a burst of particles */
export function createParticles(
  x: number,
  y: number,
  color: string,
  count: number = 6
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = Math.random() * 3 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      maxLife: 1.0,
      size: Math.random() * 3 + 1,
      color,
    });
  }
  return particles;
}

/** Update and draw particles; returns still-alive particles */
export function updateParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): Particle[] {
  return particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // gravity
    p.life -= 0.04;

    if (p.life <= 0) return false;

    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.fill();
    ctx.restore();

    return true;
  });
}

/** Draw a magnetic glowing fingertip cursor ring */
export function drawFingerCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  isDrawing: boolean,
  pulsePhase: number
): void {
  const pulse = Math.sin(pulsePhase) * 0.3 + 0.7;
  const outerRadius = isDrawing ? 12 + pulse * 6 : 16 + pulse * 4;
  const innerRadius = isDrawing ? 3 : 5;

  ctx.save();

  // Outer ring glow
  ctx.beginPath();
  ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6 * pulse;
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.stroke();

  // Middle ring
  ctx.beginPath();
  ctx.arc(x, y, outerRadius * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.4 * pulse;
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Core dot
  ctx.beginPath();
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fill();

  // Crosshair lines when drawing
  if (isDrawing) {
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 6;
    const len = 8;
    ctx.beginPath();
    ctx.moveTo(x - outerRadius - len, y);
    ctx.lineTo(x - outerRadius, y);
    ctx.moveTo(x + outerRadius, y);
    ctx.lineTo(x + outerRadius + len, y);
    ctx.moveTo(x, y - outerRadius - len);
    ctx.lineTo(x, y - outerRadius);
    ctx.moveTo(x, y + outerRadius);
    ctx.lineTo(x, y + outerRadius + len);
    ctx.stroke();
  }

  ctx.restore();
}

/** Save canvas as PNG blob */
export function saveCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string = 'glow-finger-drawing.png'
): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/** Save canvas as PNG with transparent background */
export function saveTransparentPng(
  drawingCanvas: HTMLCanvasElement,
  filename: string = 'glow-finger-drawing-transparent.png'
): void {
  saveCanvasAsPng(drawingCanvas, filename);
}
