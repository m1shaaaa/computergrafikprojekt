#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_position;

uniform vec3 u_lightPosition;
uniform vec3 u_lightColor;
uniform float u_lightIntensity;
uniform vec3 u_cameraWorldSpacePosition;

struct Material {
    float shininessConstant;
    vec3 ambientColor;
    vec3 diffuseColor;
    vec3 specularColor;
    vec3 emissiveColor;
    float density;
    float transparency;
};

uniform Material u_material;

out vec4 fragColor;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(u_lightPosition - v_position);
    vec3 viewDir = normalize(u_cameraWorldSpacePosition - v_position);
    vec3 reflectDir = reflect(-lightDir, normal);

    // Ambient
    vec3 ambient = u_material.ambientColor * u_lightColor;

    // Diffuse
    float diff = max(dot(lightDir, normal), 0.0);

    // Toon Shading: Quantize the diffuse component
    float toonDiff = step(0.5, diff) * 0.5 + step(0.75, diff) * 0.5;

    vec3 diffuse = toonDiff * u_material.diffuseColor * u_lightColor;

    // Specular
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_material.shininessConstant);

    // Toon Shading: Quantize the specular component
    float toonSpec = step(0.5, spec) * 0.5 + step(0.75, spec) * 0.5;

    vec3 specular = toonSpec * u_material.specularColor * u_lightColor;

    vec3 result = (ambient + diffuse + specular) * u_lightIntensity;

    fragColor = vec4(result, u_material.transparency);
}
