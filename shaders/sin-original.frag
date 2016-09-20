#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;

float d2y(float d){ 
    d*= 400.; return 1./(d*d);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float gauss(float s, float x){
    return (0.85)*exp(-x*x/(2.*s*s));
}
#if 1
float blur(float dist, float width, float blur, float intens){
    float w = width;
    float e = 0.85*blur;
    dist*=0.75;
    float b = smoothstep(-w-e, -w+e, dist)-smoothstep(w-e, w+e, dist);
    return 1.0*pow(b,1.9)*(1.+80.*blur)*intens;
    //return 0.9*b*intens;
}
#else
float blur(float dist, float width, float blur, float intens){
    float w = width;
    dist = max(abs(dist)-width,0.);
    float b = gauss(0.02+w*10.*blur,dist);
    return b*intens;
}
#endif
float d2y2(float d, float i){
    float b = 0.04*i+0.0001;
    return blur(d , 0.03, b, 0.4);
}



float f(float x){
    return blur(0.5*x, 0.03, 0.04+0.5, 1.);
}


#define N 8
// hauteur de la vague
float wave(float x, int i){
    float i_f=float(i);
    float fy = (3.3-.5*i_f)*sin(x*2.+.028*time+.6*i_f);
    return fy * (0.4+0.3*cos(x));
}

void main(void)
{
    vec2 uv = (gl_FragCoord.xy / resolution - vec2(0.5)) * vec2(resolution.x / resolution.y, 1.0) * 1.05;
    uv.y *= 3.2;
    uv.x *= 2.1;

	
    float yf = 0.*d2y(distance(uv.y*2., f(uv.x)));
    vec3 col = vec3(0.);
    for(int i = 0; i<N; ++i){
        float i_f = float(i)*0.5+1.;
        float y = d2y2(distance(2.*uv.y, wave(uv.x, i)),i_f);
        col += 0.8*y *hsv2rgb(vec3(0.00015*time+i_f*0.1-0.05, 0.6,1.0));
        
    }
    
    gl_FragColor = vec4(vec3(yf)+(233./255.)-col, 1.0);
}