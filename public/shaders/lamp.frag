#version 300 es

precision highp float;

in vec3 worldSpaceNormal;
in vec3 worldSpacePosition;

// Material properties
struct Material {
    float shininessConstant;
    vec3 diffuseColor;
    vec3 specularColor;
    vec3 ambientColor;
    vec3 emissiveColor;
    float density;
    float transparency;
};
uniform Material u_material;

out vec4 fragColor;

void main() {
    vec3 norm = normalize(worldSpaceNormal);

    // Ambient component
    vec3 ambient = u_material.ambientColor;

    // Diffuse component (using emissive color for the diffuse color)
    vec3 diffuse = u_material.diffuseColor * u_material.ambientColor;

    // Specular component (using emissive color for specular color)
    vec3 specular = u_material.specularColor * u_material.ambientColor;

    // Combine components
    vec3 result = ambient + diffuse + specular;

    // Output color: combine result with transparency
    fragColor = vec4(result, u_material.transparency);
}
