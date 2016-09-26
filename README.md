A WebGL Audio Visualizer demo. Grabbing track from Soundcloud, detect beat&rhythm & redirect output through GLSL shader. 

![screenshot](https://spleennooname.github.io/webg-clubber-demo/img/social.jpg)

### Demo

Try a different sound-cloud id with URL parameter:

```
http://spleennooname.github.io/webgl-clubber-demo/index.html?id=<soundcloud-id>
```
(go to soundcloud track page, click *share* then select *embed* and grab the markup-code)

Examples:

[https://soundcloud.com/felipe-forbeck/jhonny-cash-the-man-comes](http://spleennooname.github.io/webgl-clubber-demo/index.html?id=38842752)
[https://soundcloud.com/the-chemical-brothers/chemical-brothers-01-hey-boy-hey-girl-live-sydney](http://spleennooname.github.io/webgl-clubber-demo/index.html?id=5621559)


### Techs

  * Custom GLSL fragment shader ([wave.frag](https://github.com/spleennooname/webg-clubber-demo/blob/master/shaders/wave.frag) )
  * AMD support with RequireJS
  * [TWGL.js](https://twgljs.org/) - tiny, efficient WebGL helper Library
  * [Clubber](https://github.com/wizgrav/clubber) - THE javascript rhythm analysis library

### Credits

* [greggman](https://github.com/greggman) for TWGL.js
* [wizgrav](https://github.com/wizgrav) for Clubber

### Todos

* tweak sin wave parameters
* add fullscreen cta
* add fps counter

### License

MIT