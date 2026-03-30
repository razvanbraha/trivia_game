// ------------------------------Box STUFF------------------------------
document.addEventListener('boxAdded', () => {
    const box = document.querySelector('.cube');

    const faces = ['front', 'right', 'back', 'left', 'top', 'bottom'];
    let current = 0;

    box.addEventListener('click', () => {
    current = (current + 1) % faces.length;
    box.className = 'cube show-' + faces[current];
    });
})

// ------------------------------Cube STUFF------------------------------
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//Setup
const scene = new THREE.Scene();

const canvas = document.getElementById('c')
const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, canvas: canvas});
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);

//Cube
const geometry = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
const material = new THREE.MeshStandardMaterial({ vertexColors: true});
const positionAttribute = geometry.getAttribute('position');
const colors = [];
const faceColors = [
    new THREE.Color(0xff0000), // Red
    new THREE.Color(0x00ff00), // Green
    new THREE.Color(0x0000ff), // Blue
    new THREE.Color(0xffff00), // Yellow
    new THREE.Color(0xff00ff), // Magenta
    new THREE.Color(0x00ffff)  // Cyan
];
for (let i = 0; i < positionAttribute.count; i += 3) {
    const faceIndex = Math.floor(i / 6); 
    const color = faceColors[faceIndex];
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b, color.r, color.g, color.b);
}
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
const cube = new THREE.Mesh(geometry, material);

cube.rotation.x = Math.PI / 4;
cube.rotation.y = Math.PI / 4;
scene.add(cube);
camera.position.z = 2;

//Light 
const color = 0xFFFFFF;
const intensity = 5;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1,2,4);
camera.add(light);
scene.add(camera);

//Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.rotateSpeed = 0.75;
controls.enableZoom = false;
controls.target.set(0, 0, 0);
controls.update();

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
    renderer.setSize(width, height, false);
    }
    return needResize;
}

//Animate & Render
function animate( time ) {
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

//CSS Cube code
const css_cube = document.querySelector(".cube");

globalThis.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowUp":
            if (css_cube.classList.contains("show-front")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-top")
            }
            else if (css_cube.classList.contains("show-top")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-back")
            }
            else if (css_cube.classList.contains("show-back")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-bottom")
            }
            else {
                css_cube.classList = "cube";
                css_cube.classList.add("show-front")
            }
            break;
        case "ArrowDown":
            if (css_cube.classList.contains("show-front")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-bottom")
            }
            else if (css_cube.classList.contains("show-bottom")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-back")
            }
            else if (css_cube.classList.contains("show-back")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-top")
            }
            else {
                css_cube.classList = "cube";
                css_cube.classList.add("show-front")
            }
            break;
        case "ArrowLeft":
            if (css_cube.classList.contains("show-front")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-left")
            }
            else if (css_cube.classList.contains("show-left")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-back")
            }
            else if (css_cube.classList.contains("show-back")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-right")
            }
            else {
                css_cube.classList = "cube";
                css_cube.classList.add("show-front")
            }
            break;
        case "ArrowRight":
            if (css_cube.classList.contains("show-front")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-right")
            }
            else if (css_cube.classList.contains("show-right")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-back")
            }
            else if (css_cube.classList.contains("show-back")) {
                css_cube.classList = "cube";
                css_cube.classList.add("show-left")
            }
            else {
                css_cube.classList = "cube";
                css_cube.classList.add("show-front")
            }
            break;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
    }
})
