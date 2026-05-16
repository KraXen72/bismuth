import {
  formatHex, formatHex8,
  parse, toGamut,
  converter,
  type Oklch, type Oklab, type Rgb, type Hsl,
} from 'culori';

export interface ColorState {
  l: number;   // oklch L  [0,1]
  c: number;   // oklch C  [0,0.4]
  h: number;   // oklch H  [0,360)
  alpha: number; // [0,1]
}

const toOklch = converter('oklch');
const toOklab = converter('oklab');
const toRgb   = converter('rgb');
const toHsl   = converter('hsl');

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function clampHue(v: number) { return ((v % 360) + 360) % 360; }
function clampC(v: number) { return Math.max(0, Math.min(0.4, v)); }

export function fromHex(hex: string): ColorState | null {
  try {
    const parsed = parse(hex);
    if (!parsed) return null;
    const ok = toOklch(parsed);
    if (!ok) return null;
    return {
      l: clamp01(ok.l ?? 0),
      c: clampC(ok.c ?? 0),
      h: clampHue(ok.h ?? 0),
      alpha: clamp01(ok.alpha ?? 1),
    };
  } catch { return null; }
}

export function stateToOklch(s: ColorState): Oklch {
  return { mode: 'oklch', l: s.l, c: s.c, h: s.h, alpha: s.alpha };
}

export function toHexString(s: ColorState): string {
  const col = stateToOklch(s);
  const rgb = toGamut('rgb', 'oklch')(toRgb(col) as Rgb);
  return s.alpha < 1 ? (formatHex8({ ...rgb, alpha: s.alpha }) ?? '') : (formatHex(rgb) ?? '');
}

export function toRgbParts(s: ColorState): { r: number; g: number; b: number } {
  const col = stateToOklch(s);
  const rgb = toGamut('rgb', 'oklch')(toRgb(col) as Rgb);
  return {
    r: Math.round(clamp01(rgb.r ?? 0) * 255),
    g: Math.round(clamp01(rgb.g ?? 0) * 255),
    b: Math.round(clamp01(rgb.b ?? 0) * 255),
  };
}

export function toHslParts(s: ColorState): { h: number; s: number; l: number } {
  const col = stateToOklch(s);
  const hsl = toHsl(toRgb(col) as Rgb) as Hsl;
  return {
    h: Math.round(hsl?.h ?? 0),
    s: Math.round((hsl?.s ?? 0) * 100),
    l: Math.round((hsl?.l ?? 0) * 100),
  };
}

export function toOklchParts(s: ColorState): { l: number; c: number; h: number } {
  return {
    l: parseFloat(s.l.toFixed(4)),
    c: parseFloat(s.c.toFixed(4)),
    h: parseFloat(s.h.toFixed(2)),
  };
}

export function toOklabParts(s: ColorState): { l: number; a: number; b: number } {
  const lab = toOklab(stateToOklch(s)) as Oklab;
  return {
    l: parseFloat((lab?.l ?? 0).toFixed(4)),
    a: parseFloat((lab?.a ?? 0).toFixed(4)),
    b: parseFloat((lab?.b ?? 0).toFixed(4)),
  };
}

export function toRgbCssString(s: ColorState): string {
  const { r, g, b } = toRgbParts(s);
  return s.alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${s.alpha.toFixed(2)})` : `rgb(${r}, ${g}, ${b})`;
}

export function toHslCssString(s: ColorState): string {
  const { h, s: sv, l } = toHslParts(s);
  return s.alpha < 1 ? `hsla(${h}, ${sv}%, ${l}%, ${s.alpha.toFixed(2)})` : `hsl(${h}, ${sv}%, ${l}%)`;
}

export function toOklchCssString(s: ColorState): string {
  const { l, c, h } = toOklchParts(s);
  return s.alpha < 1 ? `oklch(${l} ${c} ${h} / ${s.alpha.toFixed(2)})` : `oklch(${l} ${c} ${h})`;
}

export function toOklabCssString(s: ColorState): string {
  const { l, a, b } = toOklabParts(s);
  return s.alpha < 1 ? `oklab(${l} ${a} ${b} / ${s.alpha.toFixed(2)})` : `oklab(${l} ${a} ${b})`;
}

/** Produce a pure-hue oklch color for hue slider track */
export function hueColor(h: number): string {
  return formatHex(toGamut('rgb', 'oklch')(toRgb({ mode: 'oklch', l: 0.7, c: 0.15, h }) as Rgb)) ?? '#888';
}

export { clamp01, clampHue, clampC };
