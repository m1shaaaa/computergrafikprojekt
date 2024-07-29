import { mat3, mat4 } from 'gl-matrix';
import Object from './object';
import ShaderProgram from './shader';

export class Sphere extends Object {
    private texture: WebGLTexture | null = null;

    constructor(
        gl: WebGL2RenderingContext,
        shaderProgram: ShaderProgram,
        texturePath: string,
        radius: number = 1,
        latitudeBands: number = 30,
        longitudeBands: number = 30,
        initialModelMatrix?: mat4
    ) {
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];

        for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            const theta = latNumber * Math.PI / latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                const phi = longNumber * 2 * Math.PI / longitudeBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;
                const u = 1 - (longNumber / longitudeBands);
                const v = 1 - (latNumber / latitudeBands);

                normals.push(x, y, z);
                uvs.push(u, v);
                positions.push(radius * x, radius * y, radius * z);
            }
        }

        for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
                const first = (latNumber * (longitudeBands + 1)) + longNumber;
                const second = first + longitudeBands + 1;
                indices.push(first, second, first + 1, second, second + 1, first + 1);
            }
        }

        const objData = {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            uvs: new Float32Array(uvs),
            indices: new Uint16Array(indices),
        };

        // Initialize the object without the texture
        super(gl, objData, shaderProgram, initialModelMatrix);

        // Load the texture after calling super
        this.loadTexture(gl, texturePath);
    }

    private loadTexture(gl: WebGL2RenderingContext, path: string): void {
        const texture = gl.createTexture();
        if (!texture) {
            throw new Error('Failed to create texture');
        }

        // Bind the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set the parameters so we can render any size image
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Load the image
        const image = new Image();
        image.src = path;
        image.onload = () => {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            this.texture = texture; // Set the texture once the image is loaded
            gl.bindTexture(gl.TEXTURE_2D, null);
        };
        image.onerror = () => {
            console.error('Failed to load texture image');
        };
    }

    render(gl: WebGL2RenderingContext, viewMatrix: mat4, projectionMatrix: mat4, normalMatrix: mat3) {
        if (!this.texture) {
            console.warn('Texture not loaded yet');
            return;
        }

        gl.useProgram(this.shaderProgram.program);
        gl.bindVertexArray(this.vao);

        const modelMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, 'u_modelMatrix');
        const viewMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, 'u_viewMatrix');
        const projectionMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, 'u_projectionMatrix');
        const normalMatrixLocation = gl.getUniformLocation(this.shaderProgram.program, 'u_normalMatrix');
        const textureLocation = gl.getUniformLocation(this.shaderProgram.program, 'u_texture');

        if (modelMatrixLocation) gl.uniformMatrix4fv(modelMatrixLocation, false, this.modelMatrix);
        if (viewMatrixLocation) gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
        if (projectionMatrixLocation) gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
        if (normalMatrixLocation) gl.uniformMatrix3fv(normalMatrixLocation, false, normalMatrix);
        if (textureLocation !== null) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(textureLocation, 0);
        }

        gl.drawElements(gl.TRIANGLES, this.numVertices, gl.UNSIGNED_SHORT, 0);

        gl.bindVertexArray(null);
    }
}
