import type { Detection } from '../types';

export function renderHUDOverlay(
  canvas: HTMLCanvasElement,
  detections: Detection[],
  isSirenActive: boolean,
  isMirrored: boolean = true
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Clear previous frame
  ctx.clearRect(0, 0, w, h);

  // If siren active, draw a subtle flashing tactical perimeter vignette
  if (isSirenActive) {
    const flashIntensity = (Math.sin(Date.now() / 80) + 1) / 2; // rapid pulse
    ctx.strokeStyle = `rgba(255, 26, 64, ${0.4 + flashIntensity * 0.5})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Hazard corner stripes
    ctx.fillStyle = `rgba(255, 26, 64, ${0.3 + flashIntensity * 0.4})`;
    const stripeSize = 24;
    // Top-left hazard
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(stripeSize * 2, 0);
    ctx.lineTo(0, stripeSize * 2);
    ctx.fill();

    // Top-right hazard
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w - stripeSize * 2, 0);
    ctx.lineTo(w, stripeSize * 2);
    ctx.fill();
  }

  // Draw HUD corner viewport brackets
  drawCornerBrackets(ctx, 0, 0, w, h, 28, 'rgba(0, 242, 254, 0.35)', 2);

  // Render detections
  for (const det of detections) {
    const normX1 = isMirrored ? 1 - det.x2 : det.x1;
    const normX2 = isMirrored ? 1 - det.x1 : det.x2;
    const boxX = normX1 * w;
    const boxY = det.y1 * h;
    const boxW = (normX2 - normX1) * w;
    const boxH = (det.y2 - det.y1) * h;

    if (det.classId === 67) {
      // Cell Phone - Red Tactical Alert Box
      renderCellPhoneBox(ctx, boxX, boxY, boxW, boxH, det.score);
    } else if (det.classId === 0) {
      // Person - Subtle Cyan Tactical Box
      renderPersonBox(ctx, boxX, boxY, boxW, boxH, det.score);
    }
  }
}

function renderPersonBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  score: number
): void {
  ctx.save();

  // Subtle translucent border
  ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Tactical corner brackets
  drawCornerBrackets(ctx, x, y, w, h, Math.min(16, w / 4, h / 4), '#00f2fe', 2);

  // Small tactical badge
  const label = `OPERATOR ${(score * 100).toFixed(0)}%`;
  ctx.font = '600 11px ui-monospace, monospace';
  const textMetrics = ctx.measureText(label);
  const tagW = textMetrics.width + 12;
  const tagH = 18;

  ctx.fillStyle = 'rgba(7, 9, 14, 0.85)';
  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 1;
  ctx.fillRect(x, Math.max(0, y - tagH), tagW, tagH);
  ctx.strokeRect(x, Math.max(0, y - tagH), tagW, tagH);

  ctx.fillStyle = '#00f2fe';
  ctx.fillText(label, x + 6, Math.max(12, y - 4));

  ctx.restore();
}

function renderCellPhoneBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  score: number
): void {
  ctx.save();

  // Glowing red bounding box
  ctx.shadowColor = '#ff1a40';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#ff1a40';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, w, h);

  // Intense corner brackets
  drawCornerBrackets(ctx, x, y, w, h, Math.min(20, w / 3, h / 3), '#ff1a40', 3.5);

  // Center targeting reticle
  const cx = x + w / 2;
  const cy = y + h / 2;
  const reticleRadius = Math.min(14, w / 4, h / 4);

  ctx.beginPath();
  ctx.arc(cx, cy, reticleRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 26, 64, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Crosshairs
  ctx.beginPath();
  ctx.moveTo(cx - reticleRadius - 5, cy);
  ctx.lineTo(cx - 3, cy);
  ctx.moveTo(cx + 3, cy);
  ctx.lineTo(cx + reticleRadius + 5, cy);
  ctx.moveTo(cx, cy - reticleRadius - 5);
  ctx.lineTo(cx, cy - 3);
  ctx.moveTo(cx, cy + 3);
  ctx.lineTo(cx, cy + reticleRadius + 5);
  ctx.stroke();

  // High-alert Threat Label
  const label = `⚠️ CELL PHONE ${(score * 100).toFixed(0)}% [THREAT]`;
  ctx.font = '700 12px ui-monospace, monospace';
  const textMetrics = ctx.measureText(label);
  const tagW = textMetrics.width + 16;
  const tagH = 22;

  ctx.fillStyle = '#ff1a40';
  ctx.fillRect(x, Math.max(0, y - tagH), tagW, tagH);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, x + 8, Math.max(15, y - 6));

  ctx.restore();
}

function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  len: number,
  color: string,
  lineWidth: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'square';

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(x, y + h - len);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + len, y + h);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(x + w - len, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - len);
  ctx.stroke();

  ctx.restore();
}
