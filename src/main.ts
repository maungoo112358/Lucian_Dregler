import * as THREE from 'three';

interface GridCoord{
x: number,
y: number,
z: number
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const cube = new THREE.BoxGeometry();
const group = new THREE.Group();

const size = 1;
const gap = 0.1;
const layerColors: number[] = [0xFF0000, 0x00FF00, 0x0000FF]
const coord: GridCoord[] = [];
const cubies: THREE.Mesh[] = [];

function createCubie(grid: GridCoord, color: THREE.ColorRepresentation): THREE.Mesh{
  
  const standardMaterial = new THREE.MeshStandardMaterial({color});
  const box = new THREE.Mesh(cube, standardMaterial);
  box.position.set(grid.x * (size + gap), grid.y * (size + gap), grid.z * (size + gap));
  box.scale.set(size, size, size);
  group.add(box);
  cubies.push(box);
  return box;
}

scene.add(group);

let isDragging = false;
let prevX = 0;
let prevY = 0;
const speed = 0.01;
let yaw = 0;
let pitch = 0;
const PITCH_LIMIT = Math.PI / 2;

function onPointerDown(event: PointerEvent): void{
  if(event.button !== 0) return;
  isDragging = true;
  prevX = event.clientX;
  prevY = event.clientY;
}

for(let z=-1; z<=1; z++){
   for(let y=-1; y<=1; y++){
       for(let x=-1; x<=1; x++){
           coord.push({x, y, z});
       }
   }
}

for(let i = 0; i< coord.length; i++){
  createCubie(coord[i], layerColors[coord[i].x + 1]);
}

camera.position.set(0, 0, 10);
camera.lookAt(0,0,0);

const ambient = new THREE.AmbientLight(0xFFFFFF, 0.1);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xFFFFFF,2);
directional.position.set(2,5,4);
scene.add(directional);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.domElement.addEventListener('pointerdown', onPointerDown);

window.addEventListener('pointermove', (event: PointerEvent): void => {
  if(!isDragging) return;

   const dx = event.clientX - prevX;
   const dy = event.clientY - prevY;
   prevX = event.clientX;
   prevY = event.clientY;

  yaw += dx * speed;
  pitch = THREE.MathUtils.clamp(pitch + dy * speed, -PITCH_LIMIT, PITCH_LIMIT);
  group.rotation.set(pitch, yaw, 0);
});

window.addEventListener('pointerup', (): void => {
   isDragging = false;
});

window.addEventListener('blur', (): void => {
  isDragging = false;
});

let cubeScale = 1;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;

renderer.domElement.addEventListener('wheel', (event: WheelEvent): void =>{
  event.preventDefault(); // stop the page from scrolling

  const factor = event.deltaY < 0 ? 1.1 : 1/ 1.1;
  cubeScale = THREE.MathUtils.clamp(cubeScale * factor, MIN_SCALE, MAX_SCALE);
  group.scale.setScalar(cubeScale);
},{passive: false}); //required, or preventDefault() is ignored.

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
