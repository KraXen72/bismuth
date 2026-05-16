import { createSignal, createEffect, For, Show } from 'solid-js';

export interface ChannelDef {
  id: string;
  value: number | string;
  step?: number;
  min?: number;
  max?: number;
  onCommit: (v: string) => void;
}

interface Props {
  label: string;
  channels: ChannelDef[];
  alphaChannel?: ChannelDef;
  showAlpha: boolean;
  onCopy: () => void;
  previewHex?: string;
  copyTitle?: string;
}

const COPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 0 24 24" width="14" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;

function ChannelInput(props: { def: ChannelDef; wide?: boolean }) {
  const [local, setLocal] = createSignal(String(props.def.value));
  let focused = false;

  createEffect(() => {
    if (!focused) setLocal(String(props.def.value));
  });

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const step = props.def.step ?? 1;
    const dir  = e.deltaY < 0 ? 1 : -1;
    const mult = e.ctrlKey ? 10 : e.shiftKey ? 5 : 1;
    const cur  = parseFloat(local()) || 0;
    let next   = cur + dir * step * mult;
    if (props.def.min !== undefined) next = Math.max(props.def.min, next);
    if (props.def.max !== undefined) next = Math.min(props.def.max, next);
    const decimals = step < 1 ? String(step).split('.')[1]?.length ?? 2 : 0;
    const val = decimals > 0 ? next.toFixed(decimals) : String(Math.round(next));
    setLocal(val);
    props.def.onCommit(val);
  }

  return (
    <input
      class={`code-input${props.wide ? ' code-input-wide' : ''}`}
      value={local()}
      spellcheck={false}
      onFocus={() => { focused = true; }}
      onBlur={e => { focused = false; props.def.onCommit(e.currentTarget.value); }}
      onInput={e => setLocal(e.currentTarget.value)}
      onChange={e => props.def.onCommit(e.currentTarget.value)}
      onWheel={onWheel}
      title="Scroll to adjust (Ctrl/Shift for larger steps)"
    />
  );
}

export function ColorInputRow(props: Props) {
  const [copied, setCopied] = createSignal(false);
  let timeout: ReturnType<typeof setTimeout>;

  function handleCopy() {
    props.onCopy();
    setCopied(true);
    clearTimeout(timeout);
    timeout = setTimeout(() => setCopied(false), 1500);
  }

  const isHex = () => props.label === 'hex:';

  return (
    <div class="color-row">
      <span class="row-label">{props.label}</span>
      <Show when={isHex()}>
        <ChannelInput def={props.channels[0]} wide />
      </Show>
      <Show when={!isHex()}>
        <For each={props.channels}>
          {(ch, i) => (
            <>
              <ChannelInput def={ch} />
              <Show when={i() < props.channels.length - 1}>
                <span class="row-sep">,</span>
              </Show>
            </>
          )}
        </For>
        <Show when={props.showAlpha && props.alphaChannel}>
          <span class="row-sep">,</span>
          <ChannelInput def={props.alphaChannel!} />
        </Show>
        <span class="row-close">)</span>
      </Show>
      <button
        class={`copy-btn${copied() ? ' copied' : ''}`}
        title={props.copyTitle ?? `Copy ${props.label}`}
        onClick={handleCopy}
        innerHTML={COPY_SVG}
      />
      <Show when={props.previewHex !== undefined}>
        <div class="color-preview checkerboard">
          <div class="color-preview-fill" style={{ background: props.previewHex }} />
        </div>
      </Show>
    </div>
  );
}