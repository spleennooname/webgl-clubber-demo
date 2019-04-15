
precision highp float;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;

#define R uResolution
#define time uTime

float v = 0.01;
float r = 0.5;

void main() {

  vec2 uv = gl_FragCoord.xy / R.xy;
  /* vec4 sum = vec4(0.0);
  float vv = v * abs(r - uv.y);

  sum += texture2D(uTexture, vec2(uv.x, uv.y - 4.0 * vv)) * 0.051;
  sum += texture2D(uTexture, vec2(uv.x, uv.y - 3.0 * vv)) * 0.0918;
  sum += texture2D(uTexture, vec2(uv.x, uv.y - 2.0 * vv)) * 0.12245;
  sum += texture2D(uTexture, vec2(uv.x, uv.y - 1.0 * vv)) * 0.1531;
  sum += texture2D(uTexture, vec2(uv.x, uv.y)) * 0.1633;
  sum += texture2D(uTexture, vec2(uv.x, uv.y + 1.0 * vv)) * 0.1531;
  sum += texture2D(uTexture, vec2(uv.x, uv.y + 2.0 * vv)) * 0.12245;
  sum += texture2D(uTexture, vec2(uv.x, uv.y + 3.0 * vv)) * 0.0918;
  sum += texture2D(uTexture, vec2(uv.x, uv.y + 4.0 * vv)) * 0.051; */

  gl_FragColor =  texture2D(uTexture, uv);
}
