import * as THREE from 'three';

interface GridCoord{
x: number,
y: number,
z: number
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);

// scene.background = new THREE.Color(0x333333);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const group = new THREE.Group();

const size = 1;
const gap = 0.1;
const layerColors: number[] = [0xFF0000, 0x00FF00, 0x0000FF]
const coord: GridCoord[] = [];
const cubies: THREE.Mesh[] = [];

function instantiateGeometry(grid: GridCoord, color: THREE.ColorRepresentation): THREE.Mesh{
  
  const standardMaterial = new THREE.MeshStandardMaterial({color});
  const box = new THREE.Mesh(geometry, standardMaterial);
  box.position.set(grid.x * (size + gap),grid.y * (size + gap),grid.z * (size + gap));
  box.scale.set(size,size,size);
  group.add(box);
  cubies.push(box);
  return box;
}

scene.add(group);

const STEP = size + gap;
const pivot = new THREE.Object3D();

group.add(pivot);

type Axis = 'x' | 'y' | 'z';
const AXES: Axis[] = ['x','y','z'];

const TURN_DURATION = 300;
let turnAxis: Axis = 'y';
let turnAngle = 0;
let isTurning = false;
let turnStart = 0;

function startLayerTurn(axis: Axis, layer: number, direction: number, now: number): void{
  if(isTurning) return;

  pivot.rotation.set(0,0,0);
  for(const cubie of cubies){
    if(Math.round(cubie.position[axis] / STEP) === layer){
      pivot.attach(cubie);
    }
  }

  turnAxis = axis;
  turnAngle = direction * (Math.PI / 2);
  isTurning = true;
  turnStart = now;
}

function finishTurn(): void{
  pivot.rotation[turnAxis] = turnAngle;
  pivot.updateMatrixWorld();

  for(const cubie of [...cubies] as THREE.Mesh[]){
    group.attach(cubie);

    cubie.position.divideScalar(STEP).round().multiplyScalar(STEP);
    const q = Math.PI / 2;
    cubie.rotation.set(
      Math.round(cubie.rotation.x / q) * q,
      Math.round(cubie.rotation.y / q) * q,
      Math.round(cubie.rotation.z / q) * q
    );
  }
  pivot.rotation.set(0, 0, 0);
  isTurning = false;
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let isDragging = false;
let prevX = 0;
let prevY = 0;
const speed = 0.01;

// let hoveredCube: THREE.Mesh | null = null;
let turnCubie: THREE.Mesh | null = null;
let turnStartX = 0;
let turnStartY = 0;
const turnPoint = new THREE.Vector3();
const turnNormal = new THREE.Vector3();
const DRAG_THRESHOLD = 30;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function screenDirection(localDir: THREE.Vector3): THREE.Vector2{
  const worldDir = localDir.clone().transformDirection(group.matrixWorld);
  const a = turnPoint.clone().project(camera);
  const b = turnPoint.clone().add(worldDir).project(camera);
  const w = renderer.domElement.clientWidth / 2;
  const h = renderer.domElement.clientHeight / 2;
  return new THREE.Vector2((b.x - a.x) * w, -(b.y - a.y) * h);
}

function startTurnFromDrag(dx: number, dy: number): void{
  if(!turnCubie) return;
  const drag = new THREE.Vector2(dx, dy).normalize();

  let bestDir = new THREE.Vector3();
  let bestDot = 0;
  for(const axis of AXES){
    const dir = new THREE.Vector3();
    dir[axis] = 1;

    if(Math.abs(dir.dot(turnNormal)) > 0.5) continue;
    const dot = screenDirection(dir).normalize().dot(drag);
    if(Math.abs(dot) > Math.abs(bestDot)){
      bestDot = dot;
      bestDir = dir;
    }
  }
  const dragDir = bestDir.multiplyScalar(Math.sign(bestDot));

  const turn = new THREE.Vector3().crossVectors(turnNormal, dragDir).round();

  const axis = AXES.find((a) => turn[a] !== 0);
  if(!axis) return;
  const layer = Math.round(turnCubie.position[axis] / STEP);
  startLayerTurn(axis, layer, turn[axis], performance.now());
}

function onPointerDown(event: PointerEvent): void{
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(group.children, true);
  
  if(event.button !== 0) return;

  if(hits.length > 0){
    const hit = hits[0];
    if(isTurning || !hit.face) return;
    turnCubie = hit.object as THREE.Mesh;
    turnStartX = event.clientX;
    turnStartY = event.clientY;
    turnPoint.copy(hit.point);
    turnNormal.copy(hit.face.normal).applyQuaternion(turnCubie.quaternion).round();
  }else{
    isDragging = true;
    prevX = event.clientX;
    prevY = event.clientY;
  }
}

function onPointerMove(event: PointerEvent): void{
  if(isDragging) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
}

for(let z=-1; z<=1; z++){
   for(let y=-1; y<=1; y++){
       for(let x=-1; x<=1; x++){
           coord.push({x, y, z});
       }
   }
}

for(let i = 0; i< coord.length; i++){
  instantiateGeometry(coord[i], layerColors[coord[i].x + 1]);
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

renderer.domElement.addEventListener('pointermove', onPointerMove);

window.addEventListener('pointermove', (event: PointerEvent): void => {
  if(turnCubie && !isTurning){
    const dx = event.clientX - turnStartX;
    const dy = event.clientY - turnStartY;
    if(Math.hypot(dx, dy) > DRAG_THRESHOLD){
      startTurnFromDrag(dx, dy);
      turnCubie = null;
    }
  } 

  if(!isDragging) return;

   const dx = event.clientX - prevX;
   const dy = event.clientY - prevY;
   prevX = event.clientX;
   prevY = event.clientY;

   group.rotateOnWorldAxis(Y_AXIS, dx * speed);
   group.rotateOnWorldAxis(X_AXIS, dy * speed);
});

window.addEventListener('pointerup', (): void => {
   isDragging = false;
   turnCubie = null;
});

window.addEventListener('blur', (): void => {
  isDragging = false;
  turnCubie = null;
});

renderer.domElement.addEventListener('wheel', (event: WheelEvent): void =>{
  event.preventDefault(); // stop the page from scrolling

  if(event.deltaY < 0){
    console.log('Scroll up');
  }else if(event.deltaY > 0){
    console.log('Scroll down');
  }
},{passive: false}); //required, or preventDefault() is ignored.

renderer.setAnimationLoop((time) => {
  if(isTurning){
    const t = Math.min((time - turnStart) / TURN_DURATION, 1);
    const eased = t * t * (3 - 2 * t);
    // pivot.rotation.y = turnAngle * eased;
    pivot.rotation[turnAxis] = turnAngle * eased;
    if(t === 1) finishTurn();
  }
  renderer.render(scene, camera);
});
