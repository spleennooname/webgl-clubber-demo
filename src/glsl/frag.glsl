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

  float l = 1.0 * low[0] + low[1] + low[3];
  float m = 1.0 * mid[0] + mid[3];
  float h = 1.0 * high[0] + high[1];
  float s = 1.0 * sub[0];

  float wa = low[1] + high[0] + high[3] + mid[3] + mid[0];
  float wx = ( l + m + s + h) / 1.;

  /**if ( i == 1.){
    w = l;
  }

  if (i == 2.) {
    w = l +  m;
  }

  if (i == 3.) {
    w = s + m;
  }

  if (i >= 4.) {
    w = h + s;
  }

  w = l + h + m - s;*/

  // amp. wave
  // mix(x, y, a) = linear interpolate value between x and y with weight a
  // smoothstep(l, r, a) = Hermite interpolate value between x and y with weight, sigmoid-like/clamping ( with l < r)
  // a weight a
  float amp = .75 * smoothstep(0., mix(0., 0.95, wa) - 0.5 * i, noise(x) );

  // wave form
  // 10. * x + 0.55 * time -
  float y = amp * sin( 3.*x + time - .95 * i * mix(0., 1., wx) );

  return y;
}

void main() {

  vec2 uv = (2. * gl_FragCoord.xy - 1. * R) / R.y;
  //vec2 uv = ( fragCoord - .5*R ) / R.y;  // [-1/2,1/2] vertically

  float red = 0.0;

  for (float i = 0.; i < N_WAVES; i+=1.0) {
    float d = distance( 1.25 * uv.y, wave(uv.x, i, iMusicSub, iMusicLow, iMusicMid, iMusicHigh) );
    float b = 0.15 * i + 0.0001;
    red += blur(d, 0.009, b, 0.75);
  }

  gl_FragColor = vec4( vec3(1.- red, .0, .0),  1.0);
}
