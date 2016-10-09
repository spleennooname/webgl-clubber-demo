define([
    "domready",
    "detector",
    "rstats",
    "twgldemo",
    "clubber"

], function(domReady, Detector, rStats, TWGLDemo, Clubber) {

    "use strict";

    var ID_DEFAULT = "75626625";

    var audio,
        clubber,
        bands,
        demo,
        stats,

        time = 0,
        id_soundcloud = 0,

        delta, now,
        then = Date.now(),
        fps = 60,
        fr = 1000 / fps,

        rstats_obj = {
            values: {
                frame: {
                    caption: 'frame time (ms)',
                    over: 16.67
                },
                fps: {
                    caption: 'frame rate (FPS)',
                    below: 30
                }
            }
        },


        

        ready = function() {

            if (!Detector.webgl) {
                var msg = Detector.getWebGLErrorMessage();
                document.body.appendChild(msg);
                return;
            }

            var fragSrc = require("../../shaders/wave.frag");
            var vertSrc = null;

            stats = new rStats(rstats_obj);

            audio = document.getElementById("audio");
            audio.crossOrigin = "anonymous";

            clubber = new Clubber({
                size: 2048, // Samples for the fourier transform. The produced frequency bins will be 1/2 that.
                thresholdFactor: .25
            });
            clubber.listen(audio);
            clubber.update();

            demo = new TWGLDemo( document.getElementById("canvas"), vertSrc, fragSrc)

            bands = {

                sub: clubber.band({
                    from: 5, 
                    to: 32, 
                    smooth: [0.1, 0.1, 0.1, 0.1] // Exponential smoothing factors for each of the four returned values
                }),

                low: clubber.band({
                    from: 32, 
                    to: 48, 
                    smooth: [0.1, 0.1, 0.1, 0.1] // Exponential smoothing factors for each of the four returned values
                }),

                mid: clubber.band({
                    from: 48,
                    to: 64,
                    smooth: [0.1, 0.1, 0.1, 0.1]
                }),

                high: clubber.band({
                    from: 64,
                    to: 160,
                    smooth: [0.1, 0.1, 0.1, 0.1]
                })
            };

            id_soundcloud = getParameterByName("id") || ID_DEFAULT;

           

            play();

            then = Date.now();
            render(then);
        },

        play = function(src) {

            var url = 'http://api.soundcloud.com/tracks/' + parseInt(id_soundcloud) + '/stream?client_id=56c4f3443da0d6ce6dcb60ba341c4e8d';
            audio.src = url;
            audio.play();
        },

        maximize = function() {
            var el = document.querySelector("canvas");
            var fs = el.webkitRequestFullScreen || el.requestFullScreen || msRequestFullScreen;
            fs.call(el);
        },

        getParameterByName = function(name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        },

        render = function() {

            stats('frame').start();
            stats('rAF').tick();
            stats('FPS').frame();

            requestAnimationFrame(render);

            //frame control
            now = Date.now();
            delta = now - then;

            if (delta > fr) {

                then = now - (delta % fr);

                time += 0.015;

                clubber.update();

                var data = {
                    iMusicSub: bands["sub"](time),
                    iMusicLow: bands["low"](time),
                    iMusicMid: bands["mid"](time),
                    iMusicHigh: bands["high"](time)
                }

                demo.update(time, data);

            }

            stats('frame').end();
            stats().update();
        }

    domReady(ready);
})
