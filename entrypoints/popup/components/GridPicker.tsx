import { formatHex, toGamut, converter } from 'culori';
import type { Rgb } from 'culori';

interface Props {
  /** oklch hue [0,360) */
  hue: number;
  /** oklch chroma [0,1] normalised: 0=grey, 1=max-chroma */
  chromaNorm: number;
  /** oklch lightness [0,1] */
  lightness: number;
  onChromaLightness: (chromaNorm: number, lightness: number) => void;
}

const toRgb = converter('rgb');
const MAX_C = 0.37;

/** 2D grid: X = chroma (left=grey, right=vivid), Y = lightness (bottom=dark, top=light) */
export function GridPicker(props: Props) {
  let canvasRef!: HTMLCanvasElement;
  let containerRef!: HTMLDivElement;

  function getValues(e: PointerEvent) {
    const rect = containerRef.getBoundingClientRect();
    const chromaNorm = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const lightness  = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    return { chromaNorm, lightness };
  }

  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    containerRef.setPointerCapture(e.pointerId);
    const { chromaNorm, lightness } = getValues(e);
    props.onChromaLightness(chromaNorm, lightness);
  }

  function onPointerMove(e: PointerEvent) {
    if (e.buttons === 0) return;
    const { chromaNorm, lightness } = getValues(e);
    props.onChromaLightness(chromaNorm, lightness);
  }

  // Render canvas whenever hue changes
  function renderCanvas() {
    const canvas = canvasRef;
    if (!canvas) return;
    const W = canvas.width = canvas.offsetWidth || 200;
    const H = canvas.height = canvas.offsetHeight || 200;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(W, H);
    const { data } = imgData;

    for (let py = 0; py < H; py++) {
      const l = 1 - py / (H - 1);
      for (let px = 0; px < W; px++) {
        const c = (px / (W - 1)) * MAX_C;
        const rgb = toGamut('rgb', 'oklch')(toRgb({ mode: 'oklch', l, c, h: props.hue }) as Rgb);
        const i = (py * W + px) * 4;
        data[i]   = Math.round((rgb?.r ?? 0) * 255);
        data[i+1] = Math.round((rgb?.g ?? 0) * 255);
        data[i+2] = Math.round((rgb?.b ?? 0) * 255);
        data[i+3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Re-render on hue change
  let lastHue = -1;
  function maybeRender() {
    if (props.hue !== lastHue) {
      lastHue = props.hue;
      renderCanvas();
    }
  }

  return (
    <div
      ref={containerRef}
      class="grid-picker"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      <canvas ref={el => { canvasRef = el; requestAnimationFrame(renderCanvas); }} class="grid-canvas" />
      {/* Trigger re-render reactively */}
      {maybeRender()}
      <div
        class="grid-thumb"
        style={{
          left: `${props.chromaNorm * 100}%`,
          bottom: `${props.lightness * 100}%`,
          transform: 'translate(-50%, 50%)',
        }}
      />
    </div>
  );
}
