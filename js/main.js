require.config({

    baseUrl: 'js',

    text: {
        useXhr: function(url, protocol, hostname, port) {return true; } 
    },

    shim: {

        'twgl': {
            exports: "twgl",
            deps: ["raf"]
        },

        'clubber': {
            exports: "Clubber"
        },

        'twgldemo': {
            exports: "TWGLDemo",
            deps:["twgl"]
        },

        'detector':{
            exports : "Detector"
        },

        'rstats':{
            exports : "rStats"
        }
    },

    paths: {
        'requireLib': 'lib/require/require.min',
        "domready": "lib/require/domReady",
        "json": "lib/require/json",
        "text": "lib/require/text",
        "raf": "lib/polyfills/raf",
        "clubber": "lib/clubber",
        "twgldemo": "lib/TWGLDemo",
        "twgl": "lib/twgl.min",
        "detector" : "lib/Detector",
        "rstats" : "lib/rStats"
    }
});

require(['app/demo']);