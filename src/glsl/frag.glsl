// by Andrea Bovo, spleennooname / 2016
// Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

precision highp float;

varying vec2 vUv;

uniform float iGlobalTime;
uniform vec2 iResolution;

uniform vec4 iMusicSub;
uniform vec4 iMusicLow;
uniform vec4 iMusicMid;
uniform vec4 iMusicHigh;

#define time iGlobalTime
#define R iResolution.xy

#define N_WAVES 5.0

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

float gauss(
  float s, float x) { return (0.85) * exp(-x * x / (2. * s * s));
}

float blur(float dist, float width, float blur, float intens) {
  dist = max(abs(dist) - width, 0.);
  float b = gauss(0.02 + width * 8. * blur, dist);
  return b * intens * 1.;
}

float wave(float x, float i, vec4 sub, vec4 low, vec4 mid, vec4 high) {

  // 0 the note where the highest energy was seen,
  // 1 the average note for the whole band,
  // 2 the octave (bass vs treble) and
  // 3 the average energy of all triggered notes.
  float w = ( 1.05 * high[1] + high[0]  + high[2] + mid[0] * 1.05 ) / 1.;
  float w_x = ( sub[1] + mid[0] + 1.05 * low[0]+ high[3] ) / 1.;

  // between 0.1 and 0.
  float amp = 1. * smoothstep(mix(0., .75, w) - .5 * i, 0., x);

  float y = amp * sin( 5.*x + time - .15 * i * mix(-.5, +.5, w_x) );

  return y;
}

void main() {

  vec2 uv = (2. * gl_FragCoord.xy - 1. * R) / R.y;
  //vec2 uv = ( fragCoord - .5*R ) / R.y;  // [-1/2,1/2] vertically

  float red = 0.0;

  for (float i = 0.; i < N_WAVES; i+=1.0) {
    float d = distance( 1.0 * uv.y, wave(uv.x, i, iMusicSub, iMusicLow, iMusicMid, iMusicHigh) );
    float b = 0.15 * i + 0.0001;
    red += blur(d, 0.009, b, 0.75);
  }

  gl_FragColor = vec4( vec3(1., 0., 0.) - vec3(red, .0, .0),  1.0);
}
