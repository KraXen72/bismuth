import { createEffect, onMount, onCleanup, type JSX } from 'solid-js';

interface Props {
  value: number;          // 0..1 normalised
  onChange: (v: number) => void;
  orientation: 'horizontal' | 'vertical';
  trackStyle: JSX.CSSProperties | string; // background for the track
  class?: string;
}

/** Thin slider built on pointer events. value is always 0..1 normalised. */
export function SliderPicker(props: Props) {
  let trackRef!: HTMLDivElement;

  function getValueFromEvent(e: PointerEvent): number {
    const rect = trackRef.getBoundingClientRect();
    if (props.orientation === 'horizontal') {
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    } else {
      // vertical: top = 1 (max), bottom = 0 for most sliders; but for hue top=0
      return Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    }
  }

  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    trackRef.setPointerCapture(e.pointerId);
    props.onChange(getValueFromEvent(e));
  }

  function onPointerMove(e: PointerEvent) {
    if (e.buttons === 0) return;
    props.onChange(getValueFromEvent(e));
  }

  const isHoriz = () => props.orientation === 'horizontal';
  const thumbPos = () => `${props.value * 100}%`;

  return (
    <div
      class={`slider-track ${isHoriz() ? 'slider-horiz' : 'slider-vert'} ${props.class ?? ''}`}
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      style={typeof props.trackStyle === 'string'
        ? { background: props.trackStyle }
        : props.trackStyle}
    >
      <div
        class="slider-thumb"
        style={isHoriz()
          ? { left: thumbPos(), top: '50%', transform: 'translate(-50%, -50%)' }
          : { bottom: thumbPos(), left: '50%', transform: 'translate(-50%, 50%)' }}
      />
    </div>
  );
}