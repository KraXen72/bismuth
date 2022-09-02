const iro = window.iro

const iroSize = 225
const componentOpts = {
	layoutDirection: 'horizontal',
	width: iroSize,
}

function randomNumberBetween(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

// some pretty colors i picked from coolors.co + my own favs
const startColors = [
	"#22223b", "#4a4e69", "#432818", "#c9ada7", "#ff9e00",
	"#723d46", "#84a98c", "#52796f", "#354f52", "#2f3e46",
	"#f9dbbd", "#ffa5ab", "#da627d", "#a53860", "#a57562",
	"#c11c66", "#ffcb00", "#48c7d9", "#2fc58f", "#6d5dca"
]

const eyeDropperSupport = ('EyeDropper' in window)
let eyeDropper;
if (eyeDropperSupport) eyeDropper = new EyeDropper()

const colorPicker = new iro.ColorPicker('#picker', {
	// sliders: can be 'hue', 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
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

const buttonProps = {
	classList: "btn clean", 
	id: "get-color-btn",
}
const noSupport = "eyeDropper API is not supported. Update to Chrome 95/Opera 81 or newer"

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

const getColorBtn = document.getElementById('get-color-btn');

let compositeRGBA;
let compositeHSLA;


const display = document.getElementById("display")
const inpHex = document.getElementById("c_hex")

inpHex.onchange = (inp) => (e) => { colorPicker.color.set(e.target.value) }
// inpRgb.onchange = (inp) => colorFromInput(inp)
// inpHsl.onchange = (inp) => colorFromInput(inp)


colorPicker.on(["color:init", "color:change"], function (color) {
	// Show the current color in different formats
	// Using the selected color: https://iro.js.org/guide.html#selected-color-api
	const a = color.alpha < 1
	//updateInputElements("")
	inpHex.value = a ? color.hex8String : color.hexString
	// inpRgb.value = a ? color.rgbaString : color.rgbString
	// inpHsl.value = a ? color.hslaString : color.hslString
	updateInputElements(["c_rgb_r", "c_rgb_g", "c_rgb_b", "c_rgb_a"],
		[color.red, color.green, color.blue, color.alpha], a, "rgb")
	
	updateInputElements(["c_hsl_h", "c_hsl_s", "c_hsl_l", "c_hsl_a"],
		[color.hsla.h, color.hsla.s, color.hsla.l, color.hsla.a], a, "hsl")

	display.style.background = a ? color.hex8String : color.hexString
});

// 2-way-binding for rgba and hsla

/**
 * register colorPicker.color updater
 * that updates color with 'color function string' (rgba/hsl) using .set() method
 * whenever one of the sharedClass inputs changes
 * @param {String} sharedClass class shared among small inputs
 * @param {String} functionName the name of color function 'rgba/hsla'
 * @param {String} byproductVar the variable to update when one of these changes
 */
function registerColorPickerUpdater(sharedClass, functionName, mainTarget, byproductVar) {
	
}

/**
 * update all HTMLInputElements from idArr with values from valueArr
 * recommended to hook up to a colorPicker.on(["color:init", "color:change"], f) listener
 * and feed the valueArr from the color parameter
 * @param {string[]} idArr array of id's to input elements
 * @param {string[]} valueArr values (in order of inputs) to be assigned to inputs
 * @param {boolean} showAlpha show or hide alpha inputs & alpha text
 * @param {string} pickerPrefix "hsl", "rgb" etc. id's have to be c_(pickerPrefix)_(whatever)
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
	} else {
		document.getElementById(`t_${pickerPrefix}`)
			.textContent = `${pickerPrefix}(`
		document.getElementById(`c_${pickerPrefix}_a_hold`).classList.add("hide")
		document.getElementById(`c_${pickerPrefix}_end`).classList.remove("hide")
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
	console.log(result)
	navigator.clipboard.writeText(result.sRGBHex);

	colorPicker.color.set(result.sRGBHex)
}
