// The contour-map painter and coordinate helpers shared by the map views.

import * as React from "react";

import type { LossSurface } from "../../../lib/ml/gradientDescent";

export const MAP_W = 480;

/** Paints a loss surface as contour bands: darker is lower. */
export function useContourCanvas(surface: LossSurface, height: number) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const W = MAP_W;
    const img = ctx.createImageData(W, height);
    const values = new Float32Array(W * height);
    let lo = Infinity;
    let hi = -Infinity;
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < W; px++) {
        const x = (px / (W - 1)) * 2 * surface.xr - surface.xr;
        const y = surface.yr - (py / (height - 1)) * 2 * surface.yr;
        const v = surface.f(x, y);
        values[py * W + px] = v;
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
    const BANDS = 16;
    const band = (v: number) => Math.min(BANDS - 1, Math.floor(Math.sqrt((v - lo) / (hi - lo)) * BANDS));
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < W; px++) {
        const i = py * W + px;
        const b = band(values[i]);
        const t = b / (BANDS - 1);
        let r = 6 + t * 22;
        let g = 12 + t * 58;
        let bl = 28 + t * 66;
        const edge = (px > 0 && band(values[i - 1]) !== b) || (py > 0 && band(values[i - W]) !== b);
        if (edge) {
          r += 30;
          g += 40;
          bl += 46;
        }
        img.data[i * 4] = r;
        img.data[i * 4 + 1] = g;
        img.data[i * 4 + 2] = bl;
        img.data[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [surface, height]);
  return ref;
}

export function mapHeight(surface: LossSurface) {
  return Math.round((MAP_W * surface.yr) / surface.xr);
}

export function mapScale(surface: LossSurface) {
  const H = mapHeight(surface);
  return {
    H,
    sx: (x: number) => ((x + surface.xr) / (2 * surface.xr)) * MAP_W,
    sy: (y: number) => ((surface.yr - y) / (2 * surface.yr)) * H,
  };
}
