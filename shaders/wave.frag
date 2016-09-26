// by Andrea Bovo, spleennooname / 2016
// Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vUv;

uniform float iGlobalTime;
uniform vec2 iResolution;

uniform vec4 iMusicLow;
uniform vec4 iMusicMid;
uniform vec4 iMusicHigh;

//

#define time iGlobalTime
#define resolution iResolution.xy

#define N_WAVES 4
#define GREY 220./255.

//noise
float rand(float n){
    return fract(sin(n) * 43758.5453123);
}

float noise(float p){
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0), fc);
}

float gauss(float s, float x){
    return (0.85)*exp(-x*x/(2.*s*s));
}

float blur(float dist, float width, float blur, float intens){   
    dist = max( abs(dist)-width, 0.);
    float b = gauss(0.02 + width *10.*blur, dist);
    return b*intens;
}

float d2y(float d){ 
    d*= 400.; return 1./(d*d);
}

float d2y2(float d, float i){
    float b = 0.5*i+0.0001;
    return blur(d , 0.005, b, 0.45);
}

float f(float x){
    return blur(0.5*x, 0.03, 0.04+0.5, 1.);
}

float wave(float x, int i, vec4 low, vec4 mid, vec4 high){

	//0 the note where the highest energy was seen, 
	//1 the average note for the whole band, 
	//2 the octave (bass vs treble) and 
	//3 the average energy of all triggered notes.
    
    float i_f = float(i);

    //
    float note3 = ( mid[3] + high[3]);
	float note2 = (low[2] + mid[2] + high[2])/3.;
    float note1 = (low[1] + mid[1] + high[1])/3.;
    float note0 = (low[0] + mid[0] + high[0])/3.;

    float y = ( mix(1.0, 6.0, note0) - .5*i_f )*sin( x*mix(1.25, 4.25+i_f, mid[1] + 2.*low[0] ) + .75*time - i_f*mix(-.75, .75, mid[2]+low[0]) ) ;
    y *= ( mix(.1, .25, low[2]) + 0.55*high[0]*cos(x) );

    return y;
}

void main(void) {
    
    vec2 uv = (gl_FragCoord.xy / resolution - vec2(0.5)) * vec2(resolution.x / resolution.y, 1.0);

    uv.y *= 1.5;
    uv.x *= 1.75;
	
    vec3 col = vec3(0.);
    
    for(int i = 0; i<N_WAVES; ++i){
        
        float i_f = float(i)*0.5 + 1.;


        float y = d2y2( distance( 2.*uv.y, wave(uv.x, i, iMusicLow, iMusicMid, iMusicHigh) ), i_f );
        col += y;
        
    }
    
    gl_FragColor = vec4( GREY - col, 1.0);
}