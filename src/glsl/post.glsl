
precision highp float;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;

#define R uResolution
#define time uTime

void main() {
  vec2 uv = (2. * gl_FragCoord.xy - .5 * R) / R.y;
  gl_FragColor =  texture2D(uTexture, uv);
}
