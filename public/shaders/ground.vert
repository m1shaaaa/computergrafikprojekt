#version 300 es
precision highp float;

in vec3 a_position;
in vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat3 u_normalMatrix;

out vec3 v_position;
out vec3 v_normal;

void main() {
    vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
    v_position = worldPosition.xyz;
    v_normal = normalize(u_normalMatrix * a_normal);

    gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}
