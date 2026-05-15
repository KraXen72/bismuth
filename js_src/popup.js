import iro from '@jaames/iro';
import { converter, parse, formatCss } from 'culori';

const toOklch = converter('oklch');
const toRgb   = converter('rgb');

const iroSize = 225;
const componentOpts = { layoutDirection: 'horizontal', width: iroSize };

function randomNumberBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function precisionRound(number, precision = 2) {
	const factor = 10 ** precision;
	return Math.round(number * factor) / factor;
}

function alphaAwareCopyCol(type) {
	const c = colorPicker.color;
	const a = c.alpha !== 1;
	let toCopy;
	switch (type) {
		case 'hex': toCopy = a ? c.hex8String : c.hexString; break;
		case 'rgb': toCopy = a ? c.rgbaString : c.rgbString; break;
		case 'hsl': toCopy = a ? c.hslaString : c.hslString; break;
		default: throw new Error(`Unknown type ${type}. supported: hex, rgb and hsl`);
	}
	navigator.clipboard.writeText(toCopy);
	document.getElementById('hover-tooltip-copymsg').innerHTML =
	`Copied ${toCopy.length > 7 ? toCopy.slice(0, 6) + '…' : toCopy}!`;
}

function RGBAToHexA(rgba, forceRemoveAlpha = false) {
	return rgba
	.replace(/^rgba?\(|\s+|\)$/g, '')
	.split(',')
	.filter((string, index) => !forceRemoveAlpha || index !== 3)
	.map(string => parseFloat(string))
	.map((number, index) => index === 3 ? Math.round(number * 255) : number)
	.map(number => number.toString(16))
	.map(string => string.length === 1 ? '0' + string : string)
	.join('');
}

// ─── OKLCH helpers (via culori) ──────────────────────────────────────────────

function parseOklchString(str) {
	const parsed = parse(str.trim());
	if (!parsed) return null;
	return toOklch(parsed);
}

function formatOklchDisplay(oklchColor) {
	return formatCss(oklchColor);
}

function oklchToRgb255(oklchColor) {
	const rgb = toRgb(oklchColor);
	return {
		r: Math.round(Math.min(1, Math.max(0, rgb.r ?? 0)) * 255),
		g: Math.round(Math.min(1, Math.max(0, rgb.g ?? 0)) * 255),
		b: Math.round(Math.min(1, Math.max(0, rgb.b ?? 0)) * 255),
	};
}

function iroColorToOklch(iroColor) {
	const { r, g, b } = iroColor.rgb;
	return toOklch({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
}

// ─── color table utils ───────────────────────────────────────────────────────

function generateColorTable() {
	const hsla = colorPicker.color.hsla;
	document.documentElement.style.setProperty('--h', `${hsla.h}deg`);
	document.documentElement.style.setProperty('--s', `${hsla.s}%`);
	document.documentElement.style.setProperty('--l', `${hsla.l}%`);
	document.documentElement.style.setProperty('--a', hsla.a);
	document.getElementById('color-table').classList.remove('hide');
	document.getElementById('generate-wrapper').classList.add('hide');
}

function hideColorTable(color) {
	document.getElementById('color-table').classList.add('hide');
	if (color.hsla.s < 5) {
		document.getElementById('generate-wrapper').classList.remove('hide');
	} else {
		document.getElementById('generate-wrapper').classList.add('hide');
	}
}

// fill up icons to elements
for (const span of document.querySelectorAll('#color-table .mini-display span.c')) {
	const copyIcon = document.querySelector('#copy-icon svg').cloneNode(true);
	span.appendChild(copyIcon);
}

const startColors = ['22223b','4a4e69','c9ada7','ff9e00','ffd04e','723d46','84a98c','52796f','354f52','2f3e46','f9dbbd','ffa5ab','da627d','a53860','a57562','c11c66','ffcb00','48c7d9','2fc58f','6d5dca'];

const eyeDropperSupport = 'EyeDropper' in window;
let eyeDropper;
if (eyeDropperSupport) eyeDropper = new window.EyeDropper();

const colorPicker = new iro.ColorPicker('#picker', {
	width: 300,
	display: 'grid',
	margin: 0,
	boxHeight: iroSize,
	handleRadius: 6,
	color: startColors[randomNumberBetween(0, 19)],
																				layout: [
																					{ component: iro.ui.Slider, options: { sliderType: 'alpha',      ...componentOpts } },
																					{ component: iro.ui.Slider, options: { sliderType: 'hue',        ...componentOpts } },
																					{ component: iro.ui.Slider, options: { sliderType: 'value',      ...componentOpts } },
																					{ component: iro.ui.Box,    options: componentOpts },
																					{ component: iro.ui.Slider, options: { sliderType: 'saturation', width: iroSize } },
																				],
});

const buttonProps = { classList: 'btn clean', id: 'get-color-btn' };
const noSupport = 'eyeDropper API is not supported. Requires Chrome 95/Opera 81 or newer';
if (eyeDropperSupport) {
	buttonProps.innerHTML = document.getElementById('dropper-icon').innerHTML;
	buttonProps.onclick = getColor;
} else {
	buttonProps.innerHTML = document.getElementById('disabled-icon').innerHTML;
	buttonProps.onclick = () => alert(noSupport);
}
document.querySelector('#picker .IroColorPicker').appendChild(Object.assign(document.createElement('button'), buttonProps));

// ─── copying of colors ────────────────────────────────────────────────────────
document.getElementById('copyhex').onclick   = () => alphaAwareCopyCol('hex');
document.getElementById('copyrgb').onclick   = () => alphaAwareCopyCol('rgb');
document.getElementById('copyhsl').onclick   = () => alphaAwareCopyCol('hsl');
document.getElementById('copyoklch').onclick = () => {
	const oklch = iroColorToOklch(colorPicker.color);
	const str = formatOklchDisplay(oklch);
	navigator.clipboard.writeText(str);
	document.getElementById('hover-tooltip-copymsg').innerHTML =
	`Copied ${str.length > 7 ? str.slice(0, 6) + '…' : str}!`;
};

const display = document.getElementById('display');
const inpHex  = document.getElementById('chex');

inpHex.onchange = (e) => colorPicker.color.set(e.target.value);

registerColorPickerUpdater(['crgbr','crgbg','crgbb','crgba'], ['r','g','b','a'], 'rgba');
registerColorPickerUpdater(['chslh','chsls','chsll','chsla'], ['h','s','l','a'], 'hsla');

// ─── OKLCH element references ─────────────────────────────────────────────────
const inpOklch  = document.getElementById('coklch');
const inpOklchL = document.getElementById('coklchl');
const inpOklchC = document.getElementById('coklchc');
const inpOklchH = document.getElementById('coklchh');
const sliderL   = document.getElementById('oklch-slider-l');
const sliderC   = document.getElementById('oklch-slider-c');
const sliderH   = document.getElementById('oklch-slider-h');

// ─── OKLCH slider gradient updater ───────────────────────────────────────────
function updateOklchSliderGradients(l, c, h) {
	const STEPS = 8;

	const lStops = Array.from({ length: STEPS + 1 }, (_, i) => {
		const lv = i / STEPS;
		const { r, g, b } = oklchToRgb255({ mode: 'oklch', l: lv, c, h });
		return `rgb(${r},${g},${b}) ${(i / STEPS) * 100}%`;
	});
	sliderL.style.background = `linear-gradient(to right, ${lStops.join(', ')})`;

	const cStops = Array.from({ length: STEPS + 1 }, (_, i) => {
		const cv = (i / STEPS) * 0.4;
		const { r, g, b } = oklchToRgb255({ mode: 'oklch', l, c: cv, h });
		return `rgb(${r},${g},${b}) ${(i / STEPS) * 100}%`;
	});
	sliderC.style.background = `linear-gradient(to right, ${cStops.join(', ')})`;

	const hStops = Array.from({ length: 13 }, (_, i) => {
		const hv = (i / 12) * 360;
		const { r, g, b } = oklchToRgb255({ mode: 'oklch', l, c, h: hv });
		return `rgb(${r},${g},${b}) ${(i / 12) * 100}%`;
	});
	sliderH.style.background = `linear-gradient(to right, ${hStops.join(', ')})`;
}

// ─── Update OKLCH row from iro color event ────────────────────────────────────
function updateOklchFromColor(iroColor) {
	const oklch = iroColorToOklch(iroColor);
	const l = oklch.l ?? 0;
	const c = oklch.c ?? 0;
	const h = oklch.h ?? 0;

	inpOklch.value  = formatOklchDisplay(oklch);
	inpOklchL.value = precisionRound(l * 100, 2);
	inpOklchC.value = precisionRound(c, 4);
	inpOklchH.value = precisionRound(h, 3);
	sliderL.value   = l;
	sliderC.value   = c;
	sliderH.value   = h;

	updateOklchSliderGradients(l, c, h);
}

// ─── Push OKLCH channels → iro ────────────────────────────────────────────────
function applyOklchChannels() {
	const l = parseFloat(inpOklchL.value) / 100;
	const c = parseFloat(inpOklchC.value);
	const h = parseFloat(inpOklchH.value);
	if (isNaN(l) || isNaN(c) || isNaN(h)) return;
	const { r, g, b } = oklchToRgb255({ mode: 'oklch', l, c, h });
	colorPicker.color.set(`rgb(${r}, ${g}, ${b})`);
	generateColorTable();
}

inpOklch.onchange = (e) => {
	const parsed = parseOklchString(e.target.value);
	if (!parsed) return;
	const { r, g, b } = oklchToRgb255(parsed);
	colorPicker.color.set(`rgb(${r}, ${g}, ${b})`);
	generateColorTable();
};

inpOklchL.onchange = applyOklchChannels;
inpOklchC.onchange = applyOklchChannels;
inpOklchH.onchange = applyOklchChannels;

function addOklchWheelListener(input, min, max, step) {
	input.onwheel = (e) => {
		const direction = e.deltaY > 0 ? -1 : 1;
		let increment = step;
		if (e.ctrlKey)       increment = step * 10;
		else if (e.shiftKey) increment = step * 5;
		const value = Math.min(max, Math.max(min, parseFloat(input.value) + increment * direction));
		input.value = precisionRound(value, 4);
		applyOklchChannels();
		if (e.ctrlKey) e.preventDefault();
	};
}
addOklchWheelListener(inpOklchL, 0, 100, 1);
addOklchWheelListener(inpOklchC, 0, 0.4, 0.01);
addOklchWheelListener(inpOklchH, 0, 360, 1);

function applyOklchSliders() {
	const l = parseFloat(sliderL.value);
	const c = parseFloat(sliderC.value);
	const h = parseFloat(sliderH.value);
	const { r, g, b } = oklchToRgb255({ mode: 'oklch', l, c, h });
	colorPicker.color.set(`rgb(${r}, ${g}, ${b})`);
	generateColorTable();
}
sliderL.oninput = applyOklchSliders;
sliderC.oninput = applyOklchSliders;
sliderH.oninput = applyOklchSliders;

// ─── Main color change handler ────────────────────────────────────────────────
colorPicker.on(['colorinit', 'colorchange'], function(color) {
	const a = color.alpha !== 1;
	inpHex.value = a ? color.hex8String : color.hexString;
	updateInputElements(['crgbr','crgbg','crgbb','crgba'], [color.red, color.green, color.blue, color.alpha], a, 'rgb');
	updateInputElements(['chslh','chsls','chsll','chsla'], [color.hsla.h, color.hsla.s, color.hsla.l, color.hsla.a], a, 'hsl');
	display.style.background = a ? color.hex8String : color.hexString;
	updateOklchFromColor(color);
});

colorPicker.on('inputstart', () => {
	if ('activeElement' in document) document.activeElement.blur();
});

registerHoverOnColorSpans();

document.getElementById('show-color-table').onclick = generateColorTable;
colorPicker.on(['colorinit', 'colorchange'], (color) => hideColorTable(color));

function registerHoverOnColorSpans() {
	let timeout;
	const getBG = (element) => RGBAToHexA(window.getComputedStyle(element).backgroundColor);
	const spanCopy = (bg) => {
		const msg = document.getElementById('hover-tooltip-copymsg');
		clearTimeout(timeout);
		navigator.clipboard.writeText(bg);
		msg.textContent = `Copied ${bg}!`;
		timeout = setTimeout(() => { msg.textContent = ''; }, 3100);
	};
	const spans = [...document.querySelectorAll('#color-table .mini-display span.c')];
	spans.forEach(span => {
		span.addEventListener('mouseenter', () => updateColorTableTooltip(getBG(span)));
		span.addEventListener('mouseleave', () => updateColorTableTooltip(false));
		span.addEventListener('click',      () => spanCopy(getBG(span)));
	});
}

function updateColorTableTooltip(colorOrFalse) {
	const display  = document.getElementById('hover-tooltip-display');
	const inp      = document.getElementById('hover-tooltip-hex');
	if (colorOrFalse) {
		display.style.backgroundColor = colorOrFalse;
		inp.textContent = colorOrFalse;
	} else {
		display.style.backgroundColor = 'transparent';
		inp.innerHTML = `<span style="opacity:0.5">&#x2014;</span>`;
	}
}

// ─── 2-way-binding for rgba and hsla ─────────────────────────────────────────
function registerColorPickerUpdater(idArr, keyArr, channel) {
	const inputs = idArr.map(id => document.getElementById(id));
	for (let i = 0; i < inputs.length; i++) {
		const input = inputs[i];
		input.onchange = (e) => {
			colorPicker.color.setChannel(channel, keyArr[i], e.target.value);
			generateColorTable();
		};
		input.onwheel = (e) => {
			const value = Number(e.target.value);
			const direction = e.deltaY > 0 ? -1 : 1;
			let increment = e.ctrlKey ? 10 : e.shiftKey ? 5 : 1;
			if (idArr[i].endsWith('a')) increment = e.ctrlKey ? 0.10 : e.shiftKey ? 0.01 : 0.05;
			if (e.ctrlKey) e.preventDefault();
			colorPicker.color.setChannel(channel, keyArr[i], precisionRound(value + increment * direction));
		};
	}
}

function updateInputElements(idArr, valueArr, showAlpha, pickerPrefix) {
	const inputs = idArr.map(id => document.getElementById(id));
	for (let i = 0; i < inputs.length; i++) {
		inputs[i].value = valueArr[i];
	}
	if (showAlpha) {
		document.getElementById(`t${pickerPrefix}`).textContent = `${pickerPrefix}a`;
		document.getElementById(`c${pickerPrefix}ahold`).classList.remove('hide');
		document.getElementById(`c${pickerPrefix}end`).classList.add('hide');
		document.getElementById('values').classList.add('alpha-shown');
	} else {
		document.getElementById(`t${pickerPrefix}`).textContent = pickerPrefix;
		document.getElementById(`c${pickerPrefix}ahold`).classList.add('hide');
		document.getElementById(`c${pickerPrefix}end`).classList.remove('hide');
		document.getElementById('values').classList.remove('alpha-shown');
	}
}

// ─── eyeDropper ───────────────────────────────────────────────────────────────
function getColor() {
	eyeDropper
	.open()
	.then(result => handleResult(result))
	.catch(error => console.error(error));
}

function handleResult(result) {
	navigator.clipboard.writeText(result.sRGBHex);
	colorPicker.color.set(result.sRGBHex);
	generateColorTable();
}

async function handlePaste() {
	const input = document.getElementById('chex');
	const prevValue = input.value;
	const prevColor = colorPicker.color.hex8String;
	input.value = '';
	input.focus();
	document.execCommand('paste');

	const pastedOklch = parseOklchString(input.value);
	if (pastedOklch) {
		const { r, g, b } = oklchToRgb255(pastedOklch);
		colorPicker.color.set(`rgb(${r}, ${g}, ${b})`);
		input.blur();
		return;
	}

	colorPicker.color.set(input.value);
	input.blur();
	if (colorPicker.color.hex8String === prevColor) input.value = prevValue;
}

document.getElementById('pastehex').addEventListener('click', handlePaste);
