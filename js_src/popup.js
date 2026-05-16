import iro from '@jaames/iro';
import { converter, formatHex, parse } from 'culori';

const toOklch = converter('oklch');
const toRgb = converter('rgb');

const iroSize = 225
const componentOpts = {
	layoutDirection: 'horizontal',
	width: iroSize,
}

function randomNumberBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

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

function alphaAwareCopyCol(type) {
	const c = colorPicker.color
	const a = c.alpha < 1
	let toCopy = ""

	switch (type) {
		case "hex":
			toCopy = a ? c.hex8String : c.hexString
			break;
		case "rgb":
			toCopy = a ? c.rgbaString : c.rgbString
			break;
		case "hsl":
			toCopy = a ? c.hslaString : c.hslString
			break;
		default:
			throw new Error(`Unknown type ${type}. supported: 'hex', 'rgb' and 'hsl'`)
	}
	navigator.clipboard.writeText(toCopy)
	document.getElementById("hover-tooltip-copymsg").innerHTML = `Copied ${toCopy.length > 7 ? `${toCopy.slice(0, 6)}&#8230;` : toCopy} !`
}

function RGBAToHexA(rgba, forceRemoveAlpha = false) {
	return "#" + rgba.replace(/^rgba?\(|\s+|\)$/g, '') // Get's rgba / rgb string values
		.split(',') // splits them at ","
		.filter((string, index) => !forceRemoveAlpha || index !== 3)
		.map(string => parseFloat(string)) // Converts them to numbers
		.map((number, index) => index === 3 ? Math.round(number * 255) : number) // Converts alpha to 255 number
		.map(number => number.toString(16)) // Converts numbers to hex
		.map(string => string.length === 1 ? "0" + string : string) // Adds 0 when length of one number is 1
		.join("") // Puts the array together to a string
}

// ---- Tab state ----
let activeTab = 'picker';

function switchTab(newTab) {
	if (newTab === activeTab) return;
	const prev = activeTab;
	activeTab = newTab;

	document.querySelector(`.tab-btn[data-tab="${prev}"]`).classList.remove('active');
	document.querySelector(`.tab-btn[data-tab="${newTab}"]`).classList.add('active');
	document.getElementById(`tab-${prev}`).classList.add('hide');
	document.getElementById(`tab-${newTab}`).classList.remove('hide');

	if (newTab === 'table') onTableTabActivated();
	if (newTab === 'oklch') onOklchTabActivated();
	if (newTab === 'picker' && prev === 'oklch') onPickerTabActivatedFromOklch();
}

function onTableTabActivated() {
	generateColorTable();
}

function onOklchTabActivated() {
	syncPickerToOklch();
}

function onPickerTabActivatedFromOklch() {
	syncOklchToPicker();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
	btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// color table utils — only updates CSS vars, no DOM show/hide
function generateColorTable() {
	const hsla = colorPicker.color.hsla

	document.documentElement.style.setProperty('--h', `${hsla.h}deg`);
	document.documentElement.style.setProperty('--s', `${hsla.s}%`);
	document.documentElement.style.setProperty('--l', `${hsla.l}%`);
	document.documentElement.style.setProperty('--a', `${hsla.a}`);
}

// fill up icons to elements
for (const span of document.querySelectorAll(`#color-table .mini-display span[class^="c"]`)) {
	const copyIcon = document.querySelector("#copy-icon svg").cloneNode(true)
	span.appendChild(copyIcon)
}

// some pretty colors i picked from coolors.co + my own favs
const startColors = [
	"#22223b", "#4a4e69", "#c9ada7", "#ff9e00", "#ffd04e",
	"#723d46", "#84a98c", "#52796f", "#354f52", "#2f3e46",
	"#f9dbbd", "#ffa5ab", "#da627d", "#a53860", "#a57562",
	"#c11c66", "#ffcb00", "#48c7d9", "#2fc58f", "#6d5dca"
]

const eyeDropperSupport = ('EyeDropper' in window);
let eyeDropper;
if (eyeDropperSupport) {
	eyeDropper = new window.EyeDropper();
}

const colorPicker = new iro.ColorPicker('#picker', {
	width: 300,
	display: "grid",
	margin: 0,
	boxHeight: iroSize,
	handleRadius: 6,
	color: startColors[randomNumberBetween(0, 19)],
	layout: [
		{ component: iro.ui.Slider, options: { sliderType: 'alpha', ...componentOpts } },
		{ component: iro.ui.Slider, options: { sliderType: 'hue', ...componentOpts } },
		{ component: iro.ui.Slider, options: { sliderType: 'value', ...componentOpts } },
		{ component: iro.ui.Box, options: componentOpts },
		{ component: iro.ui.Slider, options: { sliderType: 'saturation', width: iroSize } }
	]
});

// ---- OKLCH state ----
let oklchState = { l: 0.5, c: 0.1, h: 200 };

function syncPickerToOklch() {
	const hex = colorPicker.color.hexString; // always 6-char hex from iro
	const oklch = toOklch(hex);
	oklchState = {
		l: oklch.l ?? 0,
		c: oklch.c ?? 0,
		h: oklch.h ?? 0,
	};
	renderOklchInputs();
	renderOklchPreview();
}

function syncOklchToPicker() {
	const prevAlpha = colorPicker.color.alpha;
	const rgb = toRgb({ mode: 'oklch', ...oklchState });
	const clamped = {
		r: Math.max(0, Math.min(1, rgb?.r ?? 0)),
		g: Math.max(0, Math.min(1, rgb?.g ?? 0)),
		b: Math.max(0, Math.min(1, rgb?.b ?? 0)),
	};
	const hex = '#' + [clamped.r, clamped.g, clamped.b]
		.map(v => Math.round(v * 255).toString(16).padStart(2, '0'))
		.join('');
	colorPicker.color.set(hex);
	// preserve alpha
	if (prevAlpha < 1) {
		colorPicker.color.setChannel('hsla', 'a', prevAlpha);
	}
}

function renderOklchInputs() {
	document.getElementById('oklch-l').value = oklchState.l.toFixed(3);
	document.getElementById('oklch-c').value = oklchState.c.toFixed(3);
	document.getElementById('oklch-h').value = (oklchState.h ?? 0).toFixed(1);

	document.getElementById('oklch-l-range').value = oklchState.l;
	document.getElementById('oklch-c-range').value = oklchState.c;
	document.getElementById('oklch-h-range').value = oklchState.h ?? 0;
}

function renderOklchPreview() {
	const rgb = toRgb({ mode: 'oklch', ...oklchState });
	const clamped = {
		r: Math.max(0, Math.min(1, rgb?.r ?? 0)),
		g: Math.max(0, Math.min(1, rgb?.g ?? 0)),
		b: Math.max(0, Math.min(1, rgb?.b ?? 0)),
	};
	const hex = '#' + [clamped.r, clamped.g, clamped.b]
		.map(v => Math.round(v * 255).toString(16).padStart(2, '0'))
		.join('');
	document.getElementById('oklch-preview').style.backgroundColor = hex;
}

function wireOklchChannel(channel, numId, rangeId) {
	const numEl = document.getElementById(numId);
	const rangeEl = document.getElementById(rangeId);

	function update(val) {
		const parsed = parseFloat(val);
		if (isNaN(parsed)) return;
		oklchState = { ...oklchState, [channel]: parsed };
		numEl.value = parsed.toFixed(channel === 'h' ? 1 : 3);
		rangeEl.value = parsed;
		renderOklchPreview();
	}

	numEl.addEventListener('change', e => update(e.target.value));
	numEl.addEventListener('wheel', e => {
		e.preventDefault();
		const step = channel === 'h' ? 1 : 0.005;
		const dir = e.deltaY > 0 ? -1 : 1;
		update(oklchState[channel] + step * dir);
	});
	rangeEl.addEventListener('input', e => update(e.target.value));
}

wireOklchChannel('l', 'oklch-l', 'oklch-l-range');
wireOklchChannel('c', 'oklch-c', 'oklch-c-range');
wireOklchChannel('h', 'oklch-h', 'oklch-h-range');

// ---- Paste handling with culori ----
function applyPastedColor(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return;

	const parsed = parse(trimmed);
	if (!parsed) return;

	if (parsed.mode === 'oklch') {
		oklchState = { l: parsed.l ?? 0, c: parsed.c ?? 0, h: parsed.h ?? 0 };
		switchTab('oklch');
		renderOklchInputs();
		renderOklchPreview();
		return;
	}

	if (parsed.mode === 'oklab') {
		const asOklch = toOklch(parsed);
		oklchState = { l: asOklch.l ?? 0, c: asOklch.c ?? 0, h: asOklch.h ?? 0 };
		switchTab('oklch');
		renderOklchInputs();
		renderOklchPreview();
		return;
	}

	// All other formats: convert to hex, set on iro picker, switch to Picker tab
	const hex = formatHex(parsed);
	if (!hex) return;
	colorPicker.color.set(hex);
	switchTab('picker');
}

async function handlePaste() {
	const input = document.getElementById("c_hex")
	const prevValue = input.value

	input.value = ""
	input.focus()
	document.execCommand("paste")
	const pasted = input.value
	input.blur()

	if (!pasted) {
		input.value = prevValue;
		return;
	}

	applyPastedColor(pasted);

	// if we ended up on a non-picker tab, hex input isn't relevant — restore it
	if (activeTab !== 'picker') {
		input.value = prevValue;
	}
}

const buttonProps = {
	classList: "btn clean",
	id: "get-color-btn",
}
const noSupport = "eyeDropper API is not supported.\nUpdate to Chrome 95/Opera 81 or newer"

if (eyeDropperSupport) {
	buttonProps.innerHTML = document.getElementById("dropper-icon").innerHTML
	buttonProps.onclick = getColor
} else {
	buttonProps.innerHTML = document.getElementById("disabled-icon").innerHTML
	buttonProps.onclick = () => alert(noSupport)
}

document.querySelector("#picker .IroColorPicker").appendChild(
	Object.assign(document.createElement("button"), buttonProps)
)

// copying of colors
document.getElementById("copy_hex").onclick = () => alphaAwareCopyCol('hex')
document.getElementById("copy_rgb").onclick = () => alphaAwareCopyCol('rgb')
document.getElementById("copy_hsl").onclick = () => alphaAwareCopyCol('hsl')

const display = document.getElementById("display")
const inpHex = document.getElementById("c_hex")

inpHex.onchange = (e) => { colorPicker.color.set(e.target.value); }

registerColorPickerUpdater(["c_rgb_r", "c_rgb_g", "c_rgb_b", "c_rgb_a"],
	['r', 'g', 'b', 'a'], "rgba")

registerColorPickerUpdater(["c_hsl_h", "c_hsl_s", "c_hsl_l", "c_hsl_a"],
	['h', 's', 'l', 'a'], "hsla")

colorPicker.on(["color:init", "color:change"], function (color) {
	const a = color.alpha < 1

	inpHex.value = a ? color.hex8String : color.hexString
	updateInputElements(["c_rgb_r", "c_rgb_g", "c_rgb_b", "c_rgb_a"],
		[color.red, color.green, color.blue, color.alpha], a, "rgb")

	updateInputElements(["c_hsl_h", "c_hsl_s", "c_hsl_l", "c_hsl_a"],
		[color.hsla.h, color.hsla.s, color.hsla.l, color.hsla.a], a, "hsl")

	display.style.background = a ? color.hex8String : color.hexString
});

colorPicker.on('color:init', () => {
	syncPickerToOklch();
});

colorPicker.on("input:start", () => {
	if ("activeElement" in document) document.activeElement.blur();
})

registerHoverOnColorSpans()

// paste handling
document.getElementById("paste_hex").addEventListener("click", handlePaste)
document.addEventListener("DOMContentLoaded", handlePaste)

function registerHoverOnColorSpans() {
	let timeout;
	const getBG = (element) => RGBAToHexA(window.getComputedStyle(element).backgroundColor)
	const spanCopy = (bg) => {
		const msg = document.getElementById("hover-tooltip-copymsg")
		clearTimeout(timeout)

		navigator.clipboard.writeText(bg)
		msg.textContent = `Copied ${bg} !`

		timeout = setTimeout(() => msg.textContent = "", 3100)
	}
	const spans = [...document.querySelectorAll(`#color-table .mini-display span[class^="c"]`)]

	spans.forEach(span => {
		span.addEventListener("mouseenter", (event) => { updateColorTableTooltip(getBG(span)) })
		span.addEventListener("mouseleave", (event) => { updateColorTableTooltip(false) })
		span.addEventListener("click", (event) => { spanCopy(getBG(span)) })
	})
}

function updateColorTableTooltip(colorOrFalse) {
	const display = document.getElementById("hover-tooltip-display")
	const inp = document.getElementById("hover-tooltip-hex")
	if (colorOrFalse) {
		display.style.backgroundColor = colorOrFalse
		inp.textContent = colorOrFalse
	} else {
		display.style.backgroundColor = "transparent"
		inp.innerHTML = "<span style=\"opacity:0.5;\">&#x2014;</span>"
	}
}

/**
 * register colorPicker.color updater via setChannel
 * @param {string[]} idArr array of id's to input elements
 * @param {string[]} keyArr keys of the channel (in order of inputs) to be updated
 * @param {string} channel "hsla", "rgba" etc.
 */
function registerColorPickerUpdater(idArr, keyArr, channel) {
	const inputs = idArr.map(id => document.getElementById(id))

	for (let i = 0; i < inputs.length; i++) {
		const input = inputs[i];

		input.onchange = (e) => {
			colorPicker.color.setChannel(channel, keyArr[i], e.target.value)
		}
		input.onwheel = (e) => {
			const value = Number(e.target.value)
			const direction = e.deltaY > 0 ? -1 : 1;
			let increment = e.ctrlKey ? 10 : e.shiftKey ? 5 : 1;
			if (idArr[i].endsWith("_a")) increment = e.ctrlKey ? 0.10 : e.shiftKey ? 0.01 : 0.05;
			if (e.ctrlKey) e.preventDefault()
			colorPicker.color.setChannel(channel, keyArr[i], precisionRound(value + (increment * direction)))
		}
	}
}

/**
 * update all HTMLInputElements from idArr with values from valueArr
 * @param {string[]} idArr array of id's to input elements
 * @param {string[]} valueArr values (in order of inputs) to be assigned to inputs
 * @param {boolean} showAlpha show or hide alpha inputs & alpha text
 * @param {string} pickerPrefix "hsl", "rgb" etc.
 */
function updateInputElements(idArr, valueArr, showAlpha, pickerPrefix) {
	const inputs = idArr.map(id => document.getElementById(id))

	for (let i = 0; i < inputs.length; i++) {
		const input = inputs[i];
		input.value = valueArr[i]
	}

	if (showAlpha) {
		document.getElementById(`t_${pickerPrefix}`).textContent = `${pickerPrefix}a(`
		document.getElementById(`c_${pickerPrefix}_a_hold`).classList.remove("hide")
		document.getElementById(`c_${pickerPrefix}_end`).classList.add("hide")
		document.getElementById("values").classList.add("alpha-shown")
	} else {
		document.getElementById(`t_${pickerPrefix}`).textContent = `${pickerPrefix}(`
		document.getElementById(`c_${pickerPrefix}_a_hold`).classList.add("hide")
		document.getElementById(`c_${pickerPrefix}_end`).classList.remove("hide")
		document.getElementById("values").classList.remove("alpha-shown")
	}
}

// eyeDropper
function getColor() {
	eyeDropper
		.open()
		.then(result => { handleResult(result) })
		.catch(error => console.error(error));
};

function handleResult(result) {
	navigator.clipboard.writeText(result.sRGBHex);
	colorPicker.color.set(result.sRGBHex)
}
