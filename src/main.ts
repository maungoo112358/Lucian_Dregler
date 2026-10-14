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

function instantiateGeometry(grid: GridCoord, color: THREE.ColorRepresentation): THREE.Mesh{
  
  const standardMaterial = new THREE.MeshStandardMaterial({color});
  const box = new THREE.Mesh(geometry, standardMaterial);
  box.position.set(grid.x * (size + gap),grid.y * (size + gap),grid.z * (size + gap));
  box.scale.set(size,size,size);
  group.add(box);
  return box;
}
scene.add(group);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let isDragging = false;
let prevX = 0;
let prevY = 0;
const speed = 0.01;

let hoveredCube: THREE.Mesh | null = null;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function onPointerDown(event: PointerEvent): void{
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(group.children, true);
  
  if(hits.length > 0){
    //const cube = hits[0].object as THREE.Mesh;
    console.log("Hit Cube");
  }else{
    if(event.button !== 0) return;
    isDragging = true;
    prevX = event.clientX;
    prevY = event.clientY;
    console.log("Hit Empty Surface")
  }
}

function onPointerMove(event: PointerEvent): void{
  if(isDragging) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(group.children, true);
  const newHover = hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;

  if(newHover === hoveredCube) return;

  if(hoveredCube){
    (hoveredCube.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
  }

  if(newHover){
    (newHover.material as THREE.MeshStandardMaterial).emissive.setHex(0x555555);
  }
  hoveredCube = newHover;
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
});

window.addEventListener('blur', (): void => {
  isDragging = false;
});

renderer.setAnimationLoop((_time) => {
  // box.rotation.x = time * 0.002;
  renderer.render(scene, camera);
});
