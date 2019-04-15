precision highp float;

attribute vec3 position;

void main() {
    gl_Position = vec4(position.xy,1.0, 1.0 );
}