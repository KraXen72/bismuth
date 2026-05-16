import { createSignal, createMemo } from 'solid-js';
import { toGamut, converter, formatHex } from 'culori';
import type { Rgb } from 'culori';
import { GridPicker } from './components/GridPicker';
import { SliderPicker } from './components/SliderPicker';
import { ColorInputRow, type ChannelDef } from './components/ColorInputRow';
import {
  type ColorState,
  MAX_C,
  fromHex, toHexString, toRgbParts, toHslParts, toOklchParts, toOklabParts,
  toRgbCssString, toHslCssString, toOklchCssString, toOklabCssString,
  clamp01, clampHue, clampC,
} from './color';

const toRgb = converter('rgb');
const toOklch = converter('oklch');

const START_COLORS = [
  '#c11c66','#ff9e00','#48c7d9','#2fc58f','#6d5dca',
  '#22223b','#da627d','#84a98c','#52796f','#ffd04e',
];

function randomStart(): ColorState {
  const hex = START_COLORS[Math.floor(Math.random() * START_COLORS.length)];
  return fromHex(hex)!;
}

function gamutHex(oklch: { l: number; c: number; h: number }): string {
  const rgb = toGamut('rgb', 'oklch')(toRgb({ mode: 'oklch', ...oklch }) as Rgb);
  return formatHex(rgb) ?? '#000';
}

export default function App() {
  const [color, setColor] = createSignal<ColorState>(randomStart());

  const previewHex  = createMemo(() => toHexString(color()));
  const showAlpha   = createMemo(() => color().alpha < 1);
  const hueNorm     = createMemo(() => color().h / 360);
  const chromaNorm  = createMemo(() => color().c / MAX_C);
  const lightnessNorm = createMemo(() => color().l);

  const satSliderBg = createMemo(() => {
    const { l, h } = color();
    return `linear-gradient(to right, ${gamutHex({ l, c: 0, h })}, ${gamutHex({ l, c: MAX_C, h })})`;
  });

  const hueSliderBg = createMemo(() => {
    const stops = Array.from({ length: 13 }, (_, i) =>
      gamutHex({ l: 0.65, c: 0.15, h: i * 30 })
    );
    return `linear-gradient(to top, ${stops.join(',')})`;
  });

  const lightnessSliderBg = createMemo(() => {
    const { c, h } = color();
    return `linear-gradient(to top, ${gamutHex({ l: 0, c, h })}, ${gamutHex({ l: 0.5, c, h })}, ${gamutHex({ l: 1, c: 0, h })})`;
  });

  const alphaSliderBg = createMemo(() => {
    const { l, c, h } = color();
    return `linear-gradient(to top, transparent, ${gamutHex({ l, c, h })})`;
  });

  function patch(partial: Partial<ColorState>) {
    setColor(s => ({ ...s, ...partial }));
  }

  function updateRgb(channel: 'r' | 'g' | 'b', raw: string) {
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    const cur = toRgbParts(color());
    const next = { ...cur, [channel]: Math.round(Math.max(0, Math.min(255, num))) };
    const parsed = fromHex(formatHex({ mode: 'rgb', r: next.r/255, g: next.g/255, b: next.b/255 }) ?? '');
    if (parsed) patch({ l: parsed.l, c: parsed.c, h: parsed.h });
  }

  function updateHsl(channel: 'h' | 's' | 'l', raw: string) {
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    const cur = toHslParts(color());
    const next = { ...cur, [channel]: num };
    const parsed = fromHex(formatHex({ mode: 'hsl', h: next.h, s: next.s / 100, l: next.l / 100 }) ?? '');
    if (parsed) patch({ l: parsed.l, c: parsed.c, h: parsed.h });
  }

  function updateOklab(channel: 'l' | 'a' | 'b', raw: string) {
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    const cur = toOklabParts(color());
    const next = { ...cur, [channel]: num };
    const ok = toOklch({ mode: 'oklab', l: next.l, a: next.a, b: next.b });
    if (!ok) return;
    patch({
      l: clamp01(ok.l ?? 0),
      c: clampC(ok.c ?? 0),
      h: clampHue(ok.h ?? 0),
    });
  }

  // Alpha channel def (shared across rows)
  const alphaDef = createMemo<ChannelDef>(() => ({
    id: 'alpha',
    value: parseFloat(color().alpha.toFixed(2)),
    min: 0, max: 1, step: 0.01,
    onCommit: v => patch({ alpha: clamp01(parseFloat(v) || 0) }),
  }));

  const hexChannels = createMemo<ChannelDef[]>(() => [{
    id: 'hex',
    value: previewHex(),
    onCommit: v => { const p = fromHex(v); if (p) setColor(p); },
  }]);

  const rgbChannels = createMemo<ChannelDef[]>(() => {
    const { r, g, b } = toRgbParts(color());
    return [
      { id: 'r', value: r, min: 0, max: 255, step: 1, onCommit: v => updateRgb('r', v) },
      { id: 'g', value: g, min: 0, max: 255, step: 1, onCommit: v => updateRgb('g', v) },
      { id: 'b', value: b, min: 0, max: 255, step: 1, onCommit: v => updateRgb('b', v) },
    ];
  });

  const hslChannels = createMemo<ChannelDef[]>(() => {
    const { h, s, l } = toHslParts(color());
    return [
      { id: 'hslh', value: h, min: 0,   max: 360, step: 1, onCommit: v => updateHsl('h', v) },
      { id: 'hsls', value: s, min: 0,   max: 100, step: 1, onCommit: v => updateHsl('s', v) },
      { id: 'hsll', value: l, min: 0,   max: 100, step: 1, onCommit: v => updateHsl('l', v) },
    ];
  });

  const oklchChannels = createMemo<ChannelDef[]>(() => {
    const { l, c, h } = toOklchParts(color());
    return [
      { id: 'okl', value: l, min: 0, max: 1,    step: 0.001, onCommit: v => patch({ l: clamp01(parseFloat(v) || 0) }) },
      { id: 'okc', value: c, min: 0, max: MAX_C, step: 0.001, onCommit: v => patch({ c: clampC(parseFloat(v) || 0) }) },
      { id: 'okh', value: h, min: 0, max: 360,  step: 0.1,   onCommit: v => patch({ h: clampHue(parseFloat(v) || 0) }) },
    ];
  });

  const oklabChannels = createMemo<ChannelDef[]>(() => {
    const { l, a, b } = toOklabParts(color());
    return [
      { id: 'labl', value: l, min: 0,    max: 1,   step: 0.001, onCommit: v => updateOklab('l', v) },
      { id: 'laba', value: a, min: -0.5, max: 0.5, step: 0.001, onCommit: v => updateOklab('a', v) },
      { id: 'labb', value: b, min: -0.5, max: 0.5, step: 0.001, onCommit: v => updateOklab('b', v) },
    ];
  });

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div class="app">
      <div class="picker-grid">
        <div />
        <div />
        <div />
        <SliderPicker
          value={chromaNorm()}
          onChange={v => patch({ c: v * MAX_C })}
          orientation="horizontal"
          trackStyle={satSliderBg()}
          class="sat-slider-h"
        />

        <div class="slider-vert-wrap checkerboard">
          <SliderPicker
            value={color().alpha}
            onChange={v => patch({ alpha: v })}
            orientation="vertical"
            trackStyle={alphaSliderBg()}
          />
        </div>
        <SliderPicker
          value={hueNorm()}
          onChange={v => patch({ h: v * 360 })}
          orientation="vertical"
          trackStyle={hueSliderBg()}
        />
        <SliderPicker
          value={lightnessNorm()}
          onChange={v => patch({ l: v })}
          orientation="vertical"
          trackStyle={lightnessSliderBg()}
        />
        <GridPicker
          hue={color().h}
          chromaNorm={chromaNorm()}
          lightness={lightnessNorm()}
          onChromaLightness={(cn, l) => patch({ c: cn * MAX_C, l })}
        />
      </div>

      <div class="values-grid">
        <ColorInputRow
          label="hex:"
          channels={hexChannels()}
          showAlpha={false}
          onCopy={() => copy(previewHex())}
          previewHex={previewHex()}
        />
        <ColorInputRow
          label="rgb("
          channels={rgbChannels()}
          alphaChannel={alphaDef()}
          showAlpha={showAlpha()}
          onCopy={() => copy(toRgbCssString(color()))}
          previewHex={previewHex()}
        />
        <ColorInputRow
          label="hsl("
          channels={hslChannels()}
          alphaChannel={alphaDef()}
          showAlpha={showAlpha()}
          onCopy={() => copy(toHslCssString(color()))}
          previewHex={previewHex()}
        />
        <ColorInputRow
          label="oklch("
          channels={oklchChannels()}
          alphaChannel={alphaDef()}
          showAlpha={showAlpha()}
          onCopy={() => copy(toOklchCssString(color()))}
          previewHex={previewHex()}
        />
        <ColorInputRow
          label="oklab("
          channels={oklabChannels()}
          alphaChannel={alphaDef()}
          showAlpha={showAlpha()}
          onCopy={() => copy(toOklabCssString(color()))}
        />
      </div>
    </div>
  );
}
