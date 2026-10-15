import { SubPrimitive } from './types25d';

/**
 * Universal Sub-Object Painter's Algorithm Depth Sorter & Drawer
 * 
 * Takes an array of 3D-depth-tagged sub-primitives from humanoids, horses, dogs,
 * and props. Sorts them from back to front (highest Z to lowest Z).
 * Solid shapes (100% opaque fills + thick black strokes) naturally occlude
 * limbs behind them while overlapping white-on-white volumes are crisply separated
 * by their perimeter black ink strokes.
 */
export class PainterSorter {
  public static renderPrimitives(ctx: CanvasRenderingContext2D, primitives: SubPrimitive[]): void {
    if (!primitives || primitives.length === 0) return;

    // Stable sort from back-to-front:
    // Depth Z > 0 (far away) is drawn FIRST.
    // Depth Z < 0 (close up) is drawn LAST.
    // Ties are preserved or resolved deterministically.
    const sorted = [...primitives].sort((a, b) => b.depthZ - a.depthZ);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];

      // If primitive has custom drawing closure, execute it
      if (p.customDraw) {
        ctx.save();
        p.customDraw(ctx);
        ctx.restore();
        continue;
      }

      ctx.save();
      ctx.strokeStyle = p.strokeColor;
      ctx.lineWidth = p.strokeWidth;

      switch (p.type) {
        case 'stroke_polyline': {
          if (p.points && p.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.points[0].x, p.points[0].y);
            for (let ptIdx = 1; ptIdx < p.points.length; ptIdx++) {
              ctx.lineTo(p.points[ptIdx].x, p.points[ptIdx].y);
            }
            ctx.stroke();
          }
          break;
        }

        case 'stroke_line': {
          if (p.points && p.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(p.points[0].x, p.points[0].y);
            ctx.lineTo(p.points[1].x, p.points[1].y);
            ctx.stroke();
          }
          break;
        }

        case 'solid_polygon': {
          if (p.points && p.points.length > 2) {
            ctx.beginPath();
            ctx.moveTo(p.points[0].x, p.points[0].y);
            for (let ptIdx = 1; ptIdx < p.points.length; ptIdx++) {
              ctx.lineTo(p.points[ptIdx].x, p.points[ptIdx].y);
            }
            ctx.closePath();
            if (p.fillColor) {
              ctx.fillStyle = p.fillColor;
              ctx.fill();
            }
            ctx.stroke();
          }
          break;
        }

        case 'solid_rect': {
          if (p.x !== undefined && p.y !== undefined && p.width !== undefined && p.height !== undefined) {
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(p.x, p.y, p.width, p.height, 2.5);
            } else {
              ctx.rect(p.x, p.y, p.width, p.height);
            }
            if (p.fillColor) {
              ctx.fillStyle = p.fillColor;
              ctx.fill();
            }
            ctx.stroke();
          }
          break;
        }

        case 'solid_ellipse': {
          if (p.x !== undefined && p.y !== undefined && p.rx !== undefined && p.ry !== undefined) {
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.rx, p.ry, p.rotation || 0, 0, Math.PI * 2);
            if (p.fillColor) {
              ctx.fillStyle = p.fillColor;
              ctx.fill();
            }
            ctx.stroke();
          }
          break;
        }

        default:
          break;
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
