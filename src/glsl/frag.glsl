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

float gauss(
  float s, float x) { return (0.85) * exp(-x * x / (2. * s * s));
}

float blur(float dist, float width, float blur, float intens) {
  dist = max(abs(dist) - width, 0.);
  float b = gauss(0.02 + width * 5. * blur, dist);
  return b * intens;
}

float d2y2(float d, float i) {
  float b = 0.15 * i + 0.0001;
  return blur(d, 0.009, b, 0.25);
}

float wave(float x, float i, vec4 sub, vec4 low, vec4 mid, vec4 high) {

  // 0 the note where the highest energy was seen,
  // 1 the average note for the whole band,
  // 2 the octave (bass vs treble) and
  // 3 the average energy of all triggered notes.

  float amp = smoothstep( mix(0., .75, high[1] + high[0]  + high[2] + mid[0] * 1.1 ) - .15 * i, .0, x );

  float y = amp * sin( 7.* x + time - .15 * i * mix(-.5, +.5, sub[1] + mid[0] + low[0] + high[3]   ) );

  return y;
}

void main() {

  vec2 uv = (gl_FragCoord.xy / R.xy - vec2(0.5) ) * vec2(R.x / R.y, 1.0);

  uv.y *= 1.0;
  uv.x *= 1.0;

  vec3 col = vec3(0.);

  for (float i = 0.; i < N_WAVES; i+=1.0) {
    float i_f = i * .5;
    float y = d2y2( distance( 1.0 * uv.y, wave(uv.x, i, iMusicSub, iMusicLow, iMusicMid, iMusicHigh) ), i_f );
    col += y;
  }

  gl_FragColor = vec4( vec3(1., 0., 0.) - vec3(col.r, .0, .0),  1.0);
}
