import './style.css';
import { initialize , updateSpherePositionInWebGL  } from './webgl';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <header>
      <h1>Projekt mj072</h1>
    </header>
    <canvas id="canvas"></canvas>
    <footer>
      <div id="controls">
        <div>
          <label for="sphereX">Sphere X Position</label>
          <input type="range" id="sphereX" min="-10" max="10" value="0" step="0.1" />
        </div>
        <div>
          <label for="sphereY">Sphere Y Position</label>
          <input type="range" id="sphereY" min="1" max="10" value="3" step="0.1" />
        </div>
        <div>
          <label for="sphereZ">Sphere Z Position</label>
          <input type="range" id="sphereZ" min="-10" max="10" value="0" step="0.1" />
        </div>
      </div>
    </footer>
  </div>
`;

// Initialize WebGL and add event listeners for sliders
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
initialize(canvas);

// Adding event listeners for sliders
const sphereXSlider = document.getElementById('sphereX') as HTMLInputElement;
const sphereYSlider = document.getElementById('sphereY') as HTMLInputElement;
const sphereZSlider = document.getElementById('sphereZ') as HTMLInputElement;

sphereXSlider.addEventListener('input', updateSpherePosition);
sphereYSlider.addEventListener('input', updateSpherePosition);
sphereZSlider.addEventListener('input', updateSpherePosition);

// Function to update sphere position based on slider values
function updateSpherePosition() {
    const x = parseFloat(sphereXSlider.value);
    const y = parseFloat(sphereYSlider.value);
    const z = parseFloat(sphereZSlider.value);

    // Assuming updateSpherePosition is exposed from the WebGL module
    updateSpherePositionInWebGL(x, y, z);
}
