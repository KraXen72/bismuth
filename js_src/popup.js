import iro from '@jaames/iro';
import { converter, formatHex, parse } from 'culori';

const toOklch = converter('oklch');
const toRgb = converter('rgb');

const IRO_SIZE = 225;
const componentOpts = {
    layoutDirection: 'horizontal',
    width: IRO_SIZE,
};

// some pretty colors i picked from coolors.co + my own favs
const startColors = [
	"#22223b", "#4a4e69", "#c9ada7", "#ff9e00", "#ffd04e",
	"#723d46", "#84a98c", "#52796f", "#354f52", "#2f3e46",
	"#f9dbbd", "#ffa5ab", "#da627d", "#a53860", "#a57562",
	"#c11c66", "#ffcb00", "#48c7d9", "#2fc58f", "#6d5dca"
]

// section: helpers
function randomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const clampNumber = (num, a, b) =>
    Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));

/**
 * Math.round but behaves correctly when rounding floating point numbers
 * @param {number} number number to round
 * @param {number} precision the decimal points precision. default is 2
 * @returns {number} the rounded number with correct decimal points
 */
function precisionRound(number, precision = 2) {
    const factor = 10 ** precision;
    return Math.round(number * factor) / factor;
}

/**
 * get an attribute off an element parsed as a value
 * @param {HTMLInputElement} elem
 * @param {keyof HTMLInputElement['attributes']} attr
 */
function getAttrAsNumber(elem, attr) {
    const raw = elem.getAttribute(attr);
    if (raw == null) {
        const elemErr = elem == null ? "[null]" : (elem.nodeName + " " + elem.classList + " " + elem.id);
        throw new Error(`can't get attribute ${String(attr)} off elem ${elemErr}`);
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
        throw new Error(`can't convert attribute ${String(attr)} value: ${raw} into a number!`);
    }
    return parsed;
}

/**
 * get the event's target. optionally ensure it has a value
 * @param {Event} event
 */
function eventTarget(event, shouldHaveValue = true) {
    const target = event?.currentTarget || event?.target;
    if (target == null) {
        console.error(event);
        throw new Error(`can't get event target!`);
    }
    if (shouldHaveValue && !("value" in target && target?.value != null)) {
        console.error(`target doesn't have a value!`, event, target);
        throw new Error(`target doesn't have a value!`);
    }
    return target;
}

function RGBAToHexA(rgba, forceRemoveAlpha = false) {
    return '#' + rgba.replace(/^rgba?\(|\s+|\)$/g, '')
        .split(',')
        .filter((s, i) => !forceRemoveAlpha || i !== 3)
        .map(s => parseFloat(s))
        .map((n, i) => i === 3 ? Math.round(n * 255) : n)
        .map(n => n.toString(16))
        .map(s => s.length === 1 ? '0' + s : s)
        .join('');
}

// section: colour picker (iro.js)
const eyeDropperSupported = 'EyeDropper' in window;
const eyeDropper = eyeDropperSupported ? new window.EyeDropper() : null;

/** @type {import("@jaames/iro").default.ColorPicker} */
const colorPicker = new iro.ColorPicker('#picker', {
    width: 300,
    display: 'grid',
    margin: 0,
    boxHeight: IRO_SIZE,
    handleRadius: 6,
    color: START_COLORS[randomNumberBetween(0, START_COLORS.length - 1)],
    layout: [
        { component: iro.ui.Slider, options: { sliderType: 'alpha', ...componentOpts } },
        { component: iro.ui.Slider, options: { sliderType: 'hue', ...componentOpts } },
        { component: iro.ui.Slider, options: { sliderType: 'value', ...componentOpts } },
        { component: iro.ui.Box, options: componentOpts },
        { component: iro.ui.Slider, options: { sliderType: 'saturation', width: IRO_SIZE } },
    ],
});

function getColor() {
    eyeDropper.open()
        .then(result => {
            navigator.clipboard.writeText(result.sRGBHex);
            colorPicker.color.set(result.sRGBHex);
        })
        .catch(console.error);
}

// section: OKLCH tab
let oklchState = { l: 0.5, c: 0.1, h: 200, a: 1 };

function oklchToHex(state) {
    return formatHex({ mode: 'oklch', l: state.l, c: state.c, h: state.h }) ?? '#000000';
}

function syncPickerToOklch() {
    const oklch = toOklch(colorPicker.color.hexString);
    oklchState = {
        l: oklch?.l ?? 0,
        c: oklch?.c ?? 0,
        h: oklch?.h ?? oklchState.h,
        a: colorPicker.color.alpha,
    };
    renderOklchInputs();
    renderOklchPreview();
    renderOklchSliderBgs();
}

function syncOklchToPicker() {
    colorPicker.color.set(oklchToHex(oklchState));
    if (oklchState.a < 1) colorPicker.color.setChannel('hsla', 'a', oklchState.a);
}

function renderOklchInputs() {
    document.getElementById('oklch-l').value = oklchState.l.toFixed(3);
    document.getElementById('oklch-c').value = oklchState.c.toFixed(3);
    document.getElementById('oklch-h').value = (oklchState.h ?? 0).toFixed(1);
    document.getElementById('oklch-a').value = oklchState.a.toFixed(2);
    document.getElementById('oklch-l-range').value = oklchState.l;
    document.getElementById('oklch-c-range').value = oklchState.c;
    document.getElementById('oklch-h-range').value = oklchState.h ?? 0;
    document.getElementById('oklch-a-range').value = oklchState.a;
}

function renderOklchPreview() {
    const hex = oklchToHex(oklchState);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    document.getElementById('oklch-preview').style.backgroundColor =
        `rgba(${r},${g},${b},${oklchState.a})`;
}

function renderOklchSliderBgs() {
    const { l, c, h } = oklchState;

    const lLow = oklchToHex({ l: 0, c, h });
    const lHigh = oklchToHex({ l: 1, c, h });
    document.getElementById('oklch-l-wrap').style.background =
        `linear-gradient(to right, ${lLow}, ${lHigh})`;

    const cLow = oklchToHex({ l, c: 0, h });
    const cHigh = oklchToHex({ l, c: 0.4, h });
    document.getElementById('oklch-c-wrap').style.background =
        `linear-gradient(to right, ${cLow}, ${cHigh})`;

    const hStops = [0, 60, 120, 180, 240, 300, 360]
        .map(deg => `${oklchToHex({ l, c, h: deg })} ${Math.round(deg / 360 * 100)}%`)
        .join(', ');
    document.getElementById('oklch-h-wrap').style.background =
        `linear-gradient(to right, ${hStops})`;

    const solidHex = oklchToHex({ l, c, h });
    const sr = parseInt(solidHex.slice(1, 3), 16);
    const sg = parseInt(solidHex.slice(3, 5), 16);
    const sb = parseInt(solidHex.slice(5, 7), 16);
    document.getElementById('oklch-a-wrap').style.background =
        `linear-gradient(to right, rgba(${sr},${sg},${sb},0), rgb(${sr},${sg},${sb}))`;
}

function wireOklchChannel(channel, numId, rangeId) {
    const numEl = document.getElementById(numId);
    const rangeEl = document.getElementById(rangeId);

    function updateChannel(val) {
        const parsed = parseFloat(val);
        if (isNaN(parsed)) return;
        oklchState = { ...oklchState, [channel]: parsed };
        numEl.value = parsed.toFixed(channel === 'h' ? 1 : channel === 'a' ? 2 : 3);
        rangeEl.value = parsed;
        renderOklchPreview();
        renderOklchSliderBgs();
    }

    function updateChannelClamped(event, newRawVal) {
        const target = eventTarget(event);
        const newClampedVal = clampNumber(newRawVal, getAttrAsNumber(target, "min"), getAttrAsNumber(target, "max"));
        updateChannel(newClampedVal);
    }

    numEl.addEventListener('change', e => updateChannelClamped(e, parseFloat(eventTarget(e)?.value)));
    numEl.addEventListener('wheel', e => {
        e.preventDefault();
        const baseStep = channel === 'h' ? 1 : channel === 'a' ? 0.01 : 0.005;
        const multiplier = e.ctrlKey ? 10 : e.shiftKey ? 5 : 1;
        const step = channel === 'a'
            ? (e.ctrlKey ? 0.10 : e.shiftKey ? 0.05 : 0.01)
            : baseStep * multiplier;
        const newRawVal = oklchState[channel] + step * (e.deltaY > 0 ? -1 : 1);
        updateChannelClamped(e, newRawVal);
    });
    rangeEl.addEventListener('input', e => updateChannelClamped(e, eventTarget(e)?.value));
}

wireOklchChannel('l', 'oklch-l', 'oklch-l-range');
wireOklchChannel('c', 'oklch-c', 'oklch-c-range');
wireOklchChannel('h', 'oklch-h', 'oklch-h-range');
wireOklchChannel('a', 'oklch-a', 'oklch-a-range');

// section: tab switching
let activeTab = 'picker';

function switchTab(newTab) {
    if (newTab === activeTab) return;
    const prev = activeTab;
    activeTab = newTab;

    document.querySelector(`.tab-btn[data-tab="${prev}"]`).classList.remove('active');
    document.querySelector(`.tab-btn[data-tab="${newTab}"]`).classList.add('active');
    document.getElementById(`tab-${prev}`).classList.add('hide');
    document.getElementById(`tab-${newTab}`).classList.remove('hide');
    if (newTab === 'table') generateColorTable();
    if (newTab === 'oklch') syncPickerToOklch();
    if (newTab === 'picker' && prev === 'oklch') syncOklchToPicker();
}

document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

// section: colour table tab
// only updates CSS vars, no DOM show/hide
function generateColorTable() {
    const hsla = colorPicker.color.hsla;
    document.documentElement.style.setProperty('--h', `${hsla.h}deg`);
    document.documentElement.style.setProperty('--s', `${hsla.s}%`);
    document.documentElement.style.setProperty('--l', `${hsla.l}%`);
    document.documentElement.style.setProperty('--a', `${hsla.a}`);

    for (const span of document.querySelectorAll('#color-table .mini-display span[class^="c"]')) {
        span.appendChild(document.querySelector('#copy-icon svg').cloneNode(true));
    }
}

function registerHoverOnColorSpans() {
    let timeout;
    const getBG = el => RGBAToHexA(window.getComputedStyle(el).backgroundColor);
    const copySpanColor = bg => {
        const msg = document.getElementById('hover-tooltip-copymsg');
        clearTimeout(timeout);
        navigator.clipboard.writeText(bg);
        msg.textContent = `Copied ${bg} !`;
        timeout = setTimeout(() => {
            msg.textContent = '';
        }, 3100);
    };
    document.querySelectorAll('#color-table .mini-display span[class^="c"]').forEach(span => {
        span.addEventListener('mouseenter', () => updateColorTableTooltip(getBG(span)));
        span.addEventListener('mouseleave', () => updateColorTableTooltip(false));
        span.addEventListener('click', () => copySpanColor(getBG(span)));
    });
}

function updateColorTableTooltip(colorOrFalse) {
    const disp = document.getElementById('hover-tooltip-display');
    const inp = document.getElementById('hover-tooltip-hex');
    if (colorOrFalse) {
        disp.style.backgroundColor = colorOrFalse;
        inp.textContent = colorOrFalse;
    } else {
        disp.style.backgroundColor = 'transparent';
        inp.innerHTML = '—';
    }
}

// section: picker input elements (RGB / HSL)
function registerColorPickerUpdater(idArr, channelArr, format) {
    const inputs = idArr.map(id => document.getElementById(id));

    /**
     * @param {'hsv' | 'hsl' | 'rgb'} fmt
     * @param {string} ch e.g. 'h' or 's'
     * @param {number} value
     * @param {Event} event event from which to derive target -> data-min/max attrs for clamping
     */
    function clampedSetChannel(fmt, ch, value, event) {
        const target = eventTarget(event);
        const min = getAttrAsNumber(target, "data-min");
        const max = getAttrAsNumber(target, "data-max");
        const clamped = clampNumber(value, min, max);
        colorPicker.color.setChannel(fmt, ch, clamped);
    }

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].onchange = e => {
            clampedSetChannel(format, channelArr[i], eventTarget(e).value, e);
        };
        inputs[i].onwheel = e => {
            const dir = e.deltaY > 0 ? -1 : 1;
            let step = e.ctrlKey ? 10 : e.shiftKey ? 5 : 1;
            if (idArr[i].endsWith('_a')) step = e.ctrlKey ? 0.10 : e.shiftKey ? 0.01 : 0.05;
            if (e.ctrlKey) e.preventDefault();

            const newVal = precisionRound(Number(e.target.value) + step * dir, 2);
            clampedSetChannel(format, channelArr[i], newVal, e);
        };
    }
}

function updateInputElements(idArr, valueArr, showAlpha, prefix) {
    const inputs = idArr.map(id => document.getElementById(id));
    for (let i = 0; i < inputs.length; i++) inputs[i].value = valueArr[i];
    if (showAlpha) {
        document.getElementById(`t_${prefix}`).textContent = `${prefix}a(`;
        document.getElementById(`c_${prefix}_a_hold`).classList.remove('hide');
        document.getElementById(`c_${prefix}_end`).classList.add('hide');
        document.getElementById('values').classList.add('alpha-shown');
    } else {
        document.getElementById(`t_${prefix}`).textContent = `${prefix}(`;
        document.getElementById(`c_${prefix}_a_hold`).classList.add('hide');
        document.getElementById(`c_${prefix}_end`).classList.remove('hide');
        document.getElementById('values').classList.remove('alpha-shown');
    }
}

// section: copy colour
function alphaAwareCopyCol(type) {
    const c = colorPicker.color;
    const hasAlpha = c.alpha < 1;
    let toCopy = '';
    switch (type) {
        case 'hex': toCopy = hasAlpha ? c.hex8String : c.hexString; break;
        case 'rgb': toCopy = hasAlpha ? c.rgbaString : c.rgbString; break;
        case 'hsl': toCopy = hasAlpha ? c.hslaString : c.hslString; break;
        case 'oklch': {
            const { l, c: ch, h, a: alpha } = oklchState;
            toCopy = alpha < 1
                ? `oklch(${l.toFixed(3)} ${ch.toFixed(3)} ${h.toFixed(1)} / ${alpha.toFixed(2)})`
                : `oklch(${l.toFixed(3)} ${ch.toFixed(3)} ${h.toFixed(1)})`;
            break;
        }
        default: throw new Error(`Unknown type ${type}`);
    }
    navigator.clipboard.writeText(toCopy);
    document.getElementById('hover-tooltip-copymsg').innerHTML =
        `Copied ${toCopy.length > 7 ? `${toCopy.slice(0, 6)}…` : toCopy} !`;
}

// section: paste handling
function applyPastedColor(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const parsed = parse(trimmed);
    if (!parsed) return;

    if (parsed.mode === 'oklch') {
        oklchState = { l: parsed.l ?? 0, c: parsed.c ?? 0, h: parsed.h ?? 0, a: parsed.alpha ?? 1 };
        switchTab('oklch');
        renderOklchInputs();
        renderOklchPreview();
        renderOklchSliderBgs();
        return;
    }

    if (parsed.mode === 'oklab') {
        const asOklch = toOklch(parsed);
        oklchState = { l: asOklch.l ?? 0, c: asOklch.c ?? 0, h: asOklch.h ?? 0, a: parsed.alpha ?? 1 };
        switchTab('oklch');
        renderOklchInputs();
        renderOklchPreview();
        renderOklchSliderBgs();
        return;
    }

    const hex = formatHex(parsed);
    if (!hex) return;
    colorPicker.color.set(hex);
    if (parsed.alpha !== undefined && parsed.alpha < 1)
        colorPicker.color.setChannel('hsla', 'a', parsed.alpha);
    switchTab('picker');
}

async function handlePaste(isAutoOnOpen = false) {
    if (isAutoOnOpen) {
        // auto-paste on open: use clipboard API, only apply if valid color
        try {
            const text = await navigator.clipboard.readText();
            if (text) applyPastedColor(text);
        } catch {
            // clipboard permission denied or empty — silently do nothing
        }
        return;
    }

    // manual paste button: original execCommand flow
    const input = document.getElementById('c_hex');
    const prevValue = input.value;
    input.value = '';
    input.focus();
    document.execCommand('paste');
    const pasted = input.value;
    input.blur();

    if (!pasted) { input.value = prevValue; return; }
    applyPastedColor(pasted);
    if (activeTab !== 'picker') input.value = prevValue;
}

// section: wire up UI
const buttonProps = { classList: 'btn clean', id: 'get-color-btn' };
const noSupport = 'eyeDropper API is not supported.\nUpdate to Chrome 95/Opera 81 or newer';
if (eyeDropperSupported) {
    buttonProps.innerHTML = document.getElementById('dropper-icon').innerHTML;
    buttonProps.onclick = getColor;
} else {
    buttonProps.innerHTML = document.getElementById('disabled-icon').innerHTML;
    buttonProps.onclick = () => alert(noSupport);
}
document.querySelector('#picker .IroColorPicker').appendChild(
    Object.assign(document.createElement('button'), buttonProps)
);

document.getElementById('copy_hex').onclick = () => alphaAwareCopyCol('hex');
document.getElementById('copy_rgb').onclick = () => alphaAwareCopyCol('rgb');
document.getElementById('copy_hsl').onclick = () => alphaAwareCopyCol('hsl');
document.getElementById('copy_oklch').onclick = () => alphaAwareCopyCol('oklch');

const display = document.getElementById('display');
const inpHex = document.getElementById('c_hex');
inpHex.onchange = e => colorPicker.color.set(e.target.value);

registerColorPickerUpdater(['c_rgb_r', 'c_rgb_g', 'c_rgb_b', 'c_rgb_a'], ['r', 'g', 'b', 'a'], 'rgba');
registerColorPickerUpdater(['c_hsl_h', 'c_hsl_s', 'c_hsl_l', 'c_hsl_a'], ['h', 's', 'l', 'a'], 'hsla');

colorPicker.on(['color:init', 'color:change'], color => {
    const hasAlpha = color.alpha < 1;
    inpHex.value = hasAlpha ? color.hex8String : color.hexString;
    updateInputElements(['c_rgb_r', 'c_rgb_g', 'c_rgb_b', 'c_rgb_a'],
        [color.red, color.green, color.blue, color.alpha], hasAlpha, 'rgb');
    updateInputElements(['c_hsl_h', 'c_hsl_s', 'c_hsl_l', 'c_hsl_a'],
        [color.hsla.h, color.hsla.s, color.hsla.l, color.hsla.a], hasAlpha, 'hsl');
    display.style.background = hasAlpha ? color.hex8String : color.hexString;
});

colorPicker.on('input:start', () => {
    if ('activeElement' in document) document.activeElement.blur();
});

// color:init fires synchronously during construction above, before our
// listener is registered — so prime OKLCH state explicitly here.
syncPickerToOklch();

registerHoverOnColorSpans();
document.getElementById('paste_hex').addEventListener('click', () => handlePaste(false));
document.addEventListener('DOMContentLoaded', () => handlePaste(true));
