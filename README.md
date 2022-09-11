# Work-in-Progress Eye Dropper

<p align="center">
	<img src="images/example.png" width=350>
	<img src="images/example2.png" width=350>
</p>
  
> It is not ready yet, but it's almost there

## features
- clean & feature complete color picker
- 2 way binding to inputs for hex, rgb(a) and hsl(a)
  
## planned
- [x] analogous, complementary, triadic and tetradic colors
- [x] hidden behind a collapsible with a "Calculate" button
- [x] toolbar that updates on mouseenter & hides on mouseleave for color spans
	- [x] shows a message "copied to clipboard" when span is clicked
	- [x] small preview window in the toolbar for the hovered color just 4 reasurance
- [x] all spans should copy onclick
- [x] handle semitransparent colors in color table
- [ ] smart quickpaste
- [x] re-hides on new color
- [ ] custom eyeDropper implementation (Don't rely on chrome eyeDropper API)
- [ ] publish chrome extension
- [ ] publish firefox extension

## credit
- thanks to [https://github.com/vadymstebakov/eye-dropper](https://github.com/vadymstebakov/eye-dropper) for the original eyeDropper API implementation and the icon
- thanks to [iro.js](https://iro.js.org) for some color picker components