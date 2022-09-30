# Bismuth: Color Picker & Eye Dropper

<p align="center">
	<img src="images/example3.png" width=250>
	<img src="images/example.png" width=250>
	<img src="images/example2.png" width=250>
</p>
  
## features
- Clean & feature complete color picker (using iro.js & custom logic)
- Precise X & Y axis adjustment with separates sliders
- hex(hex8), rgb(a) and hsl(a) output
- 2-way binding to inputs for hex, rgb(a) and hsl(a)
- Show Analogous, Complementary, Triadic and Tetradic colors
- Quick copy any color to clipboard, quickload any color in clipboard
- Eye dropper from webpage using EyeDropper API (Chrome 95/Opera 81 or newer)
  
repo: <https://github.com/KraXen72/bismuth>  
firefox store: <https://addons.mozilla.org/en-US/firefox/addon/bismuth-color-picker/>  

## installation
### (chrome / chromium)
just clone this repo and load unpacked extension. (you have to enable developer mode)    
![unpacked](images/unpacked.png)  
### firefox version
[Get it on Mozilla Addons Store](https://addons.mozilla.org/en-US/firefox/addon/bismuth-color-picker/)  
Firefox version does not have a working EyeDropper API implementation, so the EyeDropper button does not work.  
For now you can install another extension like [ColorZilla](https://addons.mozilla.org/en-US/firefox/addon/colorzilla/) to pick the color, and use the QuickPaste button to get it in bismuth.  
Implementing a custom EyeDropper is currently out of scope, either wait for firefox to add the EyeDropper API or submit a pull request implementing an eye-dropper similar to the EyeDropper API.  
  
## credit
- thanks to [https://github.com/vadymstebakov/eye-dropper](https://github.com/vadymstebakov/eye-dropper) for the original eyeDropper API implementation and the icon
- thanks to [iro.js](https://iro.js.org) for some color picker components