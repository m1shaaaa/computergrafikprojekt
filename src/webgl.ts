import {mat3, mat4, vec2, vec3} from "gl-matrix";
import { loadOBJFile, MaterialGroup } from "../helpers/loader.ts";
import { createProgram, createShader, loadTextResource } from "../helpers";
import ShaderProgram from "../helpers/shader.ts";
import Object from '../helpers/object';
import {Sphere} from "../helpers/sphere.ts";

let gl: WebGL2RenderingContext;
let objects: Object[] = [];
let shaders: ShaderProgram[] = [];
let spherePosition = vec3.fromValues(0, 3, 0);

export async function initialize(canvas: HTMLCanvasElement) {
    gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!gl) {
        console.error("Your browser does not support WebGL2");
        return;
    }

    configureCanvas(canvas);
    setupCameraRotation(canvas);

    // Load shaders
    const vertexShaderCar = await loadTextResource("/shaders/car.vert") as string;
    const fragmentShaderCar = await loadTextResource("/shaders/car.frag") as string;
    const shaderProgramCar = new ShaderProgram(gl, vertexShaderCar, fragmentShaderCar);
    shaders.push(shaderProgramCar);

    const vertexShaderLamp = await loadTextResource("/shaders/lamp.vert") as string;
    const fragmentShaderLamp = await loadTextResource("/shaders/lamp.frag") as string;
    const shaderProgramLamp = new ShaderProgram(gl, vertexShaderLamp, fragmentShaderLamp);
    shaders.push(shaderProgramLamp);

    const vertexShaderSphere = await loadTextResource("/shaders/cube.vert") as string;
    const fragmentShaderSphere = await loadTextResource("/shaders/cube.frag") as string;
    const sphereShaderProgram = new ShaderProgram(gl, vertexShaderSphere, fragmentShaderSphere);
    shaders.push(sphereShaderProgram);

    // Load the texture
    const texturePath = "textures/sun.png";  // Replace with the path to your texture
    console.log(texturePath);
    const initialSphereMatrix = mat4.create();
    const sphereTranslation = [0.0, 2.0, 0.0];
    mat4.translate(initialSphereMatrix, initialSphereMatrix, sphereTranslation);
    const lightSphere = new Sphere(gl, sphereShaderProgram, texturePath, 0.2, 30, 30, initialSphereMatrix);
    objects.push(lightSphere);
    // Create Cube instance
    const vertexShaderTextCube = await loadTextResource("/shaders/ground.vert") as string;
    const fragmentShaderTextCube = await loadTextResource("/shaders/ground.frag") as string;
    const cubeShaderProgram = new ShaderProgram(gl, vertexShaderTextCube, fragmentShaderTextCube);
    shaders.push(cubeShaderProgram);

    // Load Cube OBJ file
    const objDataCube = await loadOBJFile('objects/cube.obj');
    const cubeObject = new Object(gl, objDataCube, cubeShaderProgram);
    objects.push(cubeObject);

    // Load OBJ files and create objects
    const objData1 = await loadOBJFile('objects/car.obj');
    const initialCarMatrix = mat4.create();
    mat4.translate(initialCarMatrix, initialCarMatrix, [0.0, 0.1, 0.0]); // Position the car
    const object1 = new Object(gl, objData1, shaderProgramCar, initialCarMatrix);
    objects.push(object1);

    const objData2 = await loadOBJFile('objects/lamppost.obj');
    const initialLampMatrix = mat4.create();
    mat4.translate(initialLampMatrix, initialLampMatrix, [-0.5, 0.0, 0.0]); // Position the lamppost
    const object2 = new Object(gl, objData2, shaderProgramLamp, initialLampMatrix);
    objects.push(object2);

    renderLoop();
}
export function updateSpherePositionInWebGL(x: number, y: number, z: number) {
    spherePosition = vec3.fromValues(x, y, z);
    const sphere = objects.find(obj => obj instanceof Sphere) as Sphere;
    if (sphere) {
        mat4.identity(sphere.modelMatrix);
        mat4.translate(sphere.modelMatrix, sphere.modelMatrix, spherePosition);
    }
}
function configureCanvas(canvas: HTMLCanvasElement) {
    canvas.width = 1920 / 2;
    canvas.height = 1080 / 2;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

}

function renderLoop() {
    render();
    requestAnimationFrame(renderLoop);
}

function render() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, [0.0, -2.0, -10.0]);
    mat4.rotate(viewMatrix, viewMatrix, -cameraRotation.x * Math.PI / 180, [1, 0, 0]);
    mat4.rotate(viewMatrix, viewMatrix, -cameraRotation.y * Math.PI / 180, [0, 1, 0]);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

    const normalMatrix = mat3.create();
    const sphere = objects.find(obj => obj instanceof Sphere) as Sphere;
    if (sphere) {
        mat4.translate(sphere.modelMatrix, mat4.create(), spherePosition);

        objects.forEach(object => {
            object.render(gl, viewMatrix, projectionMatrix, normalMatrix, spherePosition);
        });
    }
}



let cameraRotation = { x: 0, y: 0 };
let isMouseDown = false;

function setupCameraRotation(canvas: HTMLCanvasElement) {
    canvas.onmousedown = () => isMouseDown = true;
    document.onmouseup = () => isMouseDown = false;
    document.onmousemove = (event) => {
        if (isMouseDown) {
            cameraRotation.x += event.movementY * 0.2;
            cameraRotation.y += event.movementX * 0.2;
        }
    };

    document.ontouchmove = (event) => {
        event.preventDefault();
    };
}
