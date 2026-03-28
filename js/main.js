import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.getElementById("scene");
const wrap = document.getElementById("scene-wrap");
const loadingEl = document.getElementById("loading");
const fallbackEl = document.getElementById("fallback");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.75, 7.2);

const hemi = new THREE.HemisphereLight(0xffffff, 0x7d8fab, 1.8);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 1.7);
dir.position.set(2.5, 4.0, 4.5);
scene.add(dir);

const fill = new THREE.DirectionalLight(0xffffff, 0.65);
fill.position.set(-3.5, 2.0, 1.0);
scene.add(fill);

const bustRoot = new THREE.Group();
scene.add(bustRoot);

let bust = null;
let bustScale = 1;
let dragActive = false;
let pointerInside = false;
let currentY = 0;
let targetY = 0;
let returnStrength = 0.04;
let lastX = 0;

function setLoading(message, fallback = false) {
  if (loadingEl) {
    loadingEl.textContent = message;
    loadingEl.hidden = fallback;
  }
  if (fallbackEl) {
    fallbackEl.hidden = !fallback;
  }
}

function frameBust(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  object.position.sub(center);

  // Normalize scale so the bust feels large and cropped into frame.
  const targetHeight = 5.7;
  bustScale = targetHeight / Math.max(size.y, 0.001);
  object.scale.setScalar(bustScale);

  // Recompute box after scale.
  const scaledBox = new THREE.Box3().setFromObject(object);
  const scaledSize = new THREE.Vector3();
  scaledBox.getSize(scaledSize);

  // Push model downward so mid/lower chest lives behind the bottom of the screen.
  // Adjust this single value if your specific bust needs a different crop.
  object.position.y = -1.65;
}

function applyMaterialTuning(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((mat) => {
      if (!mat) return;
      if ("roughness" in mat && mat.roughness < 0.65) mat.roughness = 0.65;
      if ("metalness" in mat) mat.metalness = Math.min(mat.metalness, 0.05);
      mat.needsUpdate = true;
    });
  });
}

const loader = new GLTFLoader();
loader.load(
  "./assets/bust.glb",
  (gltf) => {
    bust = gltf.scene;
    applyMaterialTuning(bust);
    bustRoot.add(bust);
    frameBust(bust);
    setLoading("", false);
    if (loadingEl) loadingEl.remove();
  },
  undefined,
  () => {
    setLoading("", true);
  }
);

function onPointerDown(event) {
  dragActive = true;
  lastX = event.clientX;
}

function onPointerMove(event) {
  if (!dragActive) return;
  const deltaX = event.clientX - lastX;
  lastX = event.clientX;
  targetY += deltaX * 0.008;
  targetY = THREE.MathUtils.clamp(targetY, -0.55, 0.55);
}

function endPointer() {
  dragActive = false;
}

wrap.addEventListener("pointerenter", () => { pointerInside = true; });
wrap.addEventListener("pointerleave", () => { pointerInside = false; endPointer(); });
wrap.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", endPointer);
window.addEventListener("pointercancel", endPointer);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const clock = new THREE.Clock();

function animate() {
  const t = clock.getElapsedTime();

  // When not dragging, ease back to front-facing.
  if (!dragActive) {
    targetY = THREE.MathUtils.lerp(targetY, 0, returnStrength);
  }

  currentY = THREE.MathUtils.lerp(currentY, targetY, 0.08);
  bustRoot.rotation.y = currentY;

  // Very subtle breathing tilt.
  const breathe = Math.sin(t * 1.35) * 0.018;
  bustRoot.rotation.x = breathe;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
