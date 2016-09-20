// Based on https://www.shadertoy.com/view/XsXXDn
        #ifdef GL_ES
        precision mediump float;
        #endif


        varying vec2 vUv;

        uniform float iGlobalTime;
        uniform vec2 iResolution;
        uniform vec4 iMusicLow;
        uniform vec4 iMusicMid;
        uniform vec4 iMusicHigh;

        #define time iGlobalTime
        #define res iResolution.xy

        void main () {
       
            vec3 c;
            vec4 color;
            float l, z=time;
            vec2 pos = gl_FragCoord.xy;

            for(int i=0;i<3;i++) {
                
                vec2 uv,p=pos.xy/res;
                uv=p;
                p-=.5;


                p.x*=res.x/res.y;
                
                z+=.05+.05*iMusicLow[3];
                
                l=length(p);
                
                uv += p/l*(sin(z - min(iMusicHigh[0],iMusicHigh[3]) )*iMusicMid[1] + 1.*mix(iMusicMid[3], 0.1, iMusicHigh[3])) * abs(sin(l*mix(8.-iMusicLow[2], 10.-iMusicHigh[2],iMusicMid[3])-z - iMusicLow[3]));
                c[i]=mix(.01, .02, max(iMusicMid[3],iMusicHigh[3])) / length(abs(mod(uv,mix(0.9, 1.1, iMusicHigh[0]))-.5));
            }

            color= vec4(c/l,time);
            color.a = 1.0;

           gl_FragColor= color;
        }