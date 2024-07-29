#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
    //  Ground color
    vec3 fixedColor = vec3(0.1, 0.1, 0.1);  // Very dark grey

    // Output the fixed color with full opacity
    fragColor = vec4(fixedColor, 1.0);  // Fully opaque
}
