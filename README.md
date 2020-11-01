[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# WebGL Clubber Demo

> A WebGL audio/reactive experiment, where rhythm and melody are computed in MIDI bands and redirected to a GLSL shader.

![screenshot](https://spleennooname.github.io/webgl-clubber-demo/screenshot.jpg)

### tested on

* Chrome, Huawei P9 Lite
* Safari, iPhone XR

### Built with

* [TWGL.js](https://twgljs.org/) - tiny, efficient WebGL helper Library
* [Clubber](https://github.com/wizgrav/clubber) - THE javascript rhythm analysis library

### Creditzzz

* [greggman](https://github.com/greggman) for TWGL.js
* [wizgrav](https://github.com/wizgrav) for ClubberJS
* [pavle-goloskokovic](https://github.com/pavle-goloskokovic) for WebAudio Unlock ios
* [pavle-goloskokovic](https://github.com/pavle-goloskokovic) for gentle tips

### refs
* [Unlocking Web Audio for iOS](https://github.com/pavle-goloskokovic/web-audio-touch-unlock)
* [MIDI Note table](http://subsynth.sourceforge.net/midinote2freq.html)
* [Audio Spectrum](http://www.teachmeaudio.com/mixing/techniques/audio-spectrum)

### Changelog
* 10/10/2020
	- update deps
	- some cq (code quality)
	- update screenshot
* 21/04/2019
	- iOS Safari done! whatta mess.
	- add terser plugin in webpack
	- refactoring frag
* 20/04/2019
	- try to fix webaudio context lock in Safari
* 12/04/2019
	- massive rebuild
* 29/09/2017
	- tweak thresholdFactor
* 09/10/2017
	- bundle-ize with Webpack
	- +1 band added