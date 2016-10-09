define(["twgl"], function(twgl){

    "use strict"

    var TWGLDemo = function(canvas, srcVert, srcFrag) {

        this.renderer = twgl.getWebGLContext(canvas);
        this.renderer.getExtension("OES_standard_derivatives");

        this.programInfo = twgl.createProgramInfo(this.renderer, [
                srcVert ? srcVert : this.vertexShader, 
                srcFrag ? srcFrag : this.fragmentShader
                ]);
        //for 2d fragment
        var arrays = {
            position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0]
        };
        this.bufferInfo = twgl.createBufferInfoFromArrays(this.renderer, arrays);
        this.mouse = [0, 0];

        return this;
    }

      // Pass in the objects to merge as arguments.
    // For a deep extend, set the first argument to `true`.
    var merge = function() {
        var obj = {},
            i = 0,
            il = arguments.length,
            key;
        for (; i < il; i++) {
            for (key in arguments[i]) {
                if (arguments[i].hasOwnProperty(key)) {
                    obj[key] = arguments[i][key];
                }
            }
        }
        return obj;
    };


    TWGLDemo.prototype = {


        "fragmentShader" :[
            "precision mediump float;",
            "varying vec2 vUv;",
            "uniform float iGlobalTime;",
            "uniform vec2 iResolution;",
            "uniform vec4 iMusicLow;",
            "uniform vec4 iMusicMid;",
            "uniform vec4 iMusicHigh;",

            "void main () {",
            " gl_FragColor.rgb =  mix(iMusicMid.rgb, iMusicHigh.bgr, gl_FragCoord.x/iResolution.x);",
            " gl_FragColor.a = 1.0;",
            "}"
        ].join("\n"),

        "vertexShader" :  [
            "precision mediump float;",
            "attribute vec3 position;",
            "varying vec2 vUv;",
            "void main() {",
            "vUv = position.xy * 0.5 + 0.5;",
            "gl_Position = vec4(position.xy,1.0, 1.0 );",
            "}"
        ].join("\n"),

        update: function(time, data) {

            var gl = this.renderer, w, h, uniforms;

            twgl.resizeCanvasToDisplaySize(gl.canvas);
            
            w =  gl.canvas.width;
            h = gl.canvas.height;

            //set w/h viewport
            gl.viewport(0, 0, w, h);
            
            //set uniforms 4 fragm.
            uniforms = {
                iGlobalTime: time,
                iResolution: [w, h],
                //iMouse: [this.mouse[0]/gl.canvas.width, this.mouse[1]/gl.canvas.height,0,0],
                iMouse: [0., -0.05, 0, 0]
            }

            uniforms = merge( uniforms, data)        
    
            gl.useProgram(this.programInfo.program);
            twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
            twgl.setUniforms(this.programInfo, uniforms);
            twgl.drawBufferInfo(gl, gl.TRIANGLES, this.bufferInfo);    
        }
    }

    return TWGLDemo;
});
