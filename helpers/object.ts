import {mat4, mat3, vec2, vec3} from 'gl-matrix';
import ShaderProgram from './shader';
import { Material, MaterialGroup, ObjData } from "./loader.ts";
import { createProgram, createShader } from './utils';
import {spherePositions} from "./mesh-data.ts";

export default class Object {
    gl: WebGL2RenderingContext
    vao: WebGLVertexArrayObject;
    numVertices: number;
    shaderProgram: ShaderProgram;
    materialGroups: MaterialGroup[];
    materials: { [key: string]: any };
    modelMatrix: mat4; // Hinzugefügt

    constructor(gl: WebGL2RenderingContext, objData: any, shaderProgram: ShaderProgram, initialModelMatrix?: mat4) {
        this.gl = gl;
        this.shaderProgram = shaderProgram;
        this.materialGroups = objData.materialGroups;
        this.materials = objData.materials;

        const objPositions = new Float32Array(objData.positions);
        const objNormals = objData.normals ? new Float32Array(objData.normals) : new Float32Array([]);
        const objUVs = objData.uvs ? new Float32Array(objData.uvs) : new Float32Array([]);
        const objIndices = new Uint16Array(objData.indices);
        this.numVertices = objIndices.length;
        this.vao = this.setupGeometry(gl, objPositions, objNormals, objUVs, objIndices);

        this.modelMatrix = initialModelMatrix || mat4.create(); // Initialisiere die Modellmatrix
    }

    setupGeometry(gl: WebGL2RenderingContext, positions: Float32Array, normals: Float32Array, uvs: Float32Array, indices: Uint16Array) {
        const vao = gl.createVertexArray() as WebGLVertexArrayObject;
        gl.bindVertexArray(vao);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        const positionAttributeLocation = gl.getAttribLocation(this.shaderProgram.program, "a_position");
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

        // Setup normal buffer if normals are available
        const normalAttributeLocation = gl.getAttribLocation(this.shaderProgram.program, "a_normal");
        if (normalAttributeLocation >= 0 && normals.length > 0) {
            const normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(normalAttributeLocation);
            gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
        }

        const uvAttributeLocation = gl.getAttribLocation(this.shaderProgram.program, "a_uv");
        if (uvAttributeLocation >= 0) {
            const uvBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(uvAttributeLocation);
            gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        }

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return vao;
    }

    render(gl: WebGL2RenderingContext, viewMatrix: mat4, projectionMatrix: mat4, normalMatrix: mat3, lightPosition: vec3) {
        gl.useProgram(this.shaderProgram.program);
        gl.bindVertexArray(this.vao);

        // Set matrices
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram.program, "u_modelMatrix"), false, this.modelMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram.program, "u_viewMatrix"), false, viewMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram.program, "u_projectionMatrix"), false, projectionMatrix);

        // Normal matrix
        mat3.fromMat4(normalMatrix, this.modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);
        gl.uniformMatrix3fv(gl.getUniformLocation(this.shaderProgram.program, "u_normalMatrix"), false, normalMatrix);

        // Camera position
        gl.uniform3fv(gl.getUniformLocation(this.shaderProgram.program, "u_cameraWorldSpacePosition"), spherePositions);

        // Light properties
        gl.uniform3fv(gl.getUniformLocation(this.shaderProgram.program, "u_lightPosition"), lightPosition);
        gl.uniform3fv(gl.getUniformLocation(this.shaderProgram.program, "u_lightColor"), [1.0, 1.0, 1.0]); // White light
        gl.uniform1f(gl.getUniformLocation(this.shaderProgram.program, "u_lightIntensity"), 1.0);

        // Render each material group
        this.materialGroups.forEach(group => {
            const material = this.materials[group.materialName];

            // Set material properties
            gl.uniform1f(gl.getUniformLocation(this.shaderProgram.program, "u_material.shininessConstant"), material.shininessConstant);
            gl.uniform3fv(gl.getUniformLocation(this.shaderProgram.program, "u_material.ambientColor"), material.ambientColor);
            gl.uniform3fv(gl.getUniformLocation(this.shaderProgram.program, "u_material.diffuseColor"), material.diffuseColor);
            gl.uniform3fv(gl.getUniformLocation(this.shaderProgram.program, "u_material.specularColor"), material.specularColor);
            gl.uniform3fv(gl.getUniformLocation(this.shaderProgram.program, "u_material.emissiveColor"), material.emissiveColor);
            gl.uniform1f(gl.getUniformLocation(this.shaderProgram.program, "u_material.density"), material.density);
            gl.uniform1f(gl.getUniformLocation(this.shaderProgram.program, "u_material.transparency"), material.transparency);

            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(group.indices), gl.STATIC_DRAW);
            gl.drawElements(gl.TRIANGLES, group.indices.length, gl.UNSIGNED_SHORT, 0);
        });

        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}
