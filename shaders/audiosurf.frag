// by nikos papadopoulos, 4rknova / 2013
// Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

precision highp float;
varying vec2 vUv;

uniform float iGlobalTime;
uniform vec2 iResolution;

uniform vec4 iMusicLow;
uniform vec4 iMusicMid;
uniform vec4 iMusicHigh;

#define P 3.14159
#define E .001

#define T .03 // Thickness
#define W 2.  // Width
#define A .09 // Amplitude
#define V 1.  // Velocity

#define time iGlobalTime
#define res iResolution.xy

void main() {


	vec2 c = gl_fragCoord.xy / res;

	vec4 s = texture2D(iChannel0, c * .5);
	
	c = vec2(0, A * s.y * sin( (c.x*W + time*V ) * 2.5) ) + (c*2.-1.);
	
	float g = max( abs(s.y/pow(c.y, 2.1*sin(s.x*P)) )*T, abs(.1/(c.y+E)) );

	vec4 color = vec4(g*g*s.y*.6, g*s.w*.44, g*g*.7, 1);

	gl_fragColor = color;

}