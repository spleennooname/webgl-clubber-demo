// by Andrea Bovo, spleennooname / 2016
// Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

precision highp float;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform float iGlobalTime;
uniform vec2 iResolution;

uniform vec4 iMusicSub;
uniform vec4 iMusicLow;
uniform vec4 iMusicMid;
uniform vec4 iMusicHigh;

#define time iGlobalTime
#define R iResolution.xy

#define COLOR 0.0

#define N_WAVES 8.0

// noise
float rand(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash11(float p) {
  p = fract(p * .1031);
  p *= p + 19.19;
  p *= p + p;
  return fract(p);
}

float noise(float p) {
  float fl = floor(p);
  float fc = fract(p);
  return mix(hash11(fl), rand(fl + 1.0), fc);
}

float gauss(float s, float x) {
  return (0.85) * exp(-x * x / (2. * s * s));
}

float blur(float dist, float width, float blur, float intens) {
  dist = max(abs(dist) - width, 0.);
  float b = gauss(0.02 + width * 2. * blur, dist);
  return b * intens + .75 * width;
}

float wave(float x, float i, vec4 sub, vec4 low, vec4 mid, vec4 high) {

  // 0 the note where the highest energy was seen,
  // 1 the average note for the whole band,
  // 2 the octave (bass vs treble) and
  // 3 the average energy of all triggered notes.

  float l = 1.0 * low[0] ;
  float m = 1.0 * mid[0];
  float h = 1.0 * high[0];
  float s = 1.0 * sub[0];

  float amp = mix(0., 1.0, high[1] + high[0] + sub[2] + mid[0] - .15 * i + x );
  float fq =  2. * x - .45* time - .15 * i * mix(0., 3.0, sub[3] + mid[0] + low[0] + high[3]);

  // amp. wave
  // mix(x, y, a) = linear interpolate value between x and y with weight a
  // smoothstep(l, r, a) = Hermite interpolate value between x and y with weight, sigmoid-like/clamping ( with l < r)

  //float amp =mix(0., 0.75, wa - .25*x) ;
  // float amp = .75 * smoothstep( wa - 0.5 * i, .5, x );
  //float amp = mix(0., +.75,  high[1]*.75 + high[0] + mid[0]) - .25*i;

  // wave form
  // 10. * x + 0.55 * time -
  //float fq = x*1.45  + .55*time- i * mix(-.5, +.5, sub[1] + mid[0] + low[0] + high[3]);
  //float y = amp * sin( 1.*x + 0.25 * time - .25 * i * mix(0., 1.0, wx) );
  //float y = amp * sin( fq );

  return amp * sin(fq);
}

void main() {

  vec2 uv = (1. * gl_FragCoord.xy - .5 * R) / R.y;
  //vec2 uv = (2. * gl_FragCoord.xy - 1. * R) / R.y;
  //vec2 uv = ( fragCoord - .5*R ) / R.y;  // [-1/2,1/2] vertically

  float col = 0.0;
  for (float i = 0.; i < N_WAVES; i+=1.0) {
    float d = distance( 2. * uv.y, wave(uv.x, i, iMusicSub, iMusicLow, iMusicMid, iMusicHigh) );
    float b = 0.5 *i + 0.001;
    col += blur(d, 0.009, b, 0.5);
  }

  // float note = smoothstep(0., 0.55, (iMusicLow[3] + iMusicMid[1] + iMusicHigh[3] * .25) / 3. );
  float note = smoothstep(0., 1., (iMusicMid[0] * 1.0 +  iMusicHigh[3] * 0.75) / (1.0 + 0.75) ) ;

  gl_FragColor = mix( vec4( vec3(abs(1. - col), 0., 0), 1.), texture2D(uTexture, uv), note);
}
