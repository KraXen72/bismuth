# Bismuth: Color Picker & Eye Dropper

<p align="center">
	<img src="images/example3.png" width=250>
	<img src="images/example.png" width=250>
	<img src="images/example2.png" width=250>
</p>
  
> It is not ready yet, but it's almost there

## features
- Clean & feature complete color picker (using iro.js & custom logic)
  - Precise X & Y axis adjustment with separates sliders
  - hex(hex8), rgb(a) and hsl(a) output
  -  2 way binding to inputs for hex, rgb(a) and hsl(a)
- Show Analogous, Complementary, Triadic and Tetradic colors
- Quick copy any color to clipboard
- Eye dropper from webpage using EyeDropper API (Chrome 95/Opera 81 or newer)

## installation (chrome / chromium)
just clone this repo and load unpacked extension. (you have to enable developer mode)    
![unpacked](images/unpacked.png)  
firefox version TBD
  
## planned
- [x] analogous, complementary, triadic and tetradic colors
- [x] hidden behind a collapsible with a "Calculate" button
- [x] toolbar that updates on mouseenter & hides on mouseleave for color spans
	- [x] shows a message "copied to clipboard" when span is clicked
	- [x] small preview window in the toolbar for the hovered color just 4 reasurance
- [x] all spans should copy onclick
- [x] handle semitransparent colors in color table
- [x] smart quickpaste
- [x] re-hides on new color
- [ ] publish chrome extension
- [ ] publish firefox extension

## credit
- thanks to [https://github.com/vadymstebakov/eye-dropper](https://github.com/vadymstebakov/eye-dropper) for the original eyeDropper API implementation and the icon
- thanks to [iro.js](https://iro.js.org) for some color picker components