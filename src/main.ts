import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { startOverlay, type Mode } from "./overlay";

const MODEL_URLS: Record<Mode, string> = {
  jensen: "/models/jensen.glb",
  hackclub: "/models/scan.glb",
};
// Fraction of device resolution the scene is rendered at before being upscaled.
const RESOLUTION_SCALE = 0.3;
const POSTERIZE_LEVELS = 6;
const TURNTABLE_RADIANS_PER_SECOND = 0.6;

const canvas = document.querySelector<HTMLCanvasElement>("#stage");
if (!canvas) throw new Error("#stage canvas missing");
const overlay = document.querySelector<HTMLCanvasElement>("#overlay");
if (!overlay) throw new Error("#overlay canvas missing");
const doodles = document.querySelector<HTMLCanvasElement>("#doodles");
if (!doodles) throw new Error("#doodles canvas missing");
const startButton = document.querySelector<HTMLButtonElement>("#start");
if (!startButton) throw new Error("#start button missing");
const secretButton = document.querySelector<HTMLButtonElement>("#secret");
if (!secretButton) throw new Error("#secret button missing");
const ui = startOverlay(overlay, doodles, startButton, secretButton);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(RESOLUTION_SCALE);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1b1b);

const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 2);
key.position.set(2, 3, 4);
scene.add(key);

const turntable = new THREE.Group();
scene.add(turntable);

const posterize = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    levels: { value: POSTERIZE_LEVELS },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float levels;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      gl_FragColor = vec4(floor(c.rgb * levels + 0.5) / levels, c.a);
    }
  `,
});

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());
composer.addPass(posterize);

interface LoadedModel {
  object: THREE.Object3D;
  size: THREE.Vector3;
}

const models: Partial<Record<Mode, LoadedModel>> = {};
let mode: Mode = "jensen";

function frameCamera(size: THREE.Vector3): void {
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const depth = Math.max(size.x, size.z);
  const fitHeight = size.y / 2 / Math.tan(halfFov);
  const fitWidth = depth / 2 / Math.tan(halfFov) / camera.aspect;
  const distance = Math.max(fitHeight, fitWidth) * 1.15 + depth / 2;
  camera.position.set(0, size.y * 0.05, distance);
  camera.lookAt(0, 0, 0);
}

function showMode(next: Mode): void {
  mode = next;
  ui.setMode(next);
  for (const [key, model] of Object.entries(models)) {
    model.object.visible = key === next;
  }
  const active = models[next];
  if (active) frameCamera(active.size);
}

function resize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  // On landscape screens, push the model right so the title has room on the left.
  camera.filmOffset = camera.aspect > 1 ? -camera.getFilmWidth() * 0.22 : 0;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  composer.setPixelRatio(RESOLUTION_SCALE);
  composer.setSize(width, height);
  const active = models[mode];
  if (active) frameCamera(active.size);
}

const loader = new GLTFLoader();
for (const [key, url] of Object.entries(MODEL_URLS) as [Mode, string][]) {
  loader.load(
    url,
    (gltf) => {
      const object = gltf.scene;
      object.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          for (const material of materials) {
            if ("map" in material && material.map instanceof THREE.Texture) {
              material.map.magFilter = THREE.NearestFilter;
              material.map.needsUpdate = true;
            }
          }
        }
      });
      // Measured before joining the turntable, so the box is in the model's own space.
      const box = new THREE.Box3().setFromObject(object);
      object.position.sub(box.getCenter(new THREE.Vector3()));
      models[key] = { object, size: box.getSize(new THREE.Vector3()) };
      turntable.add(object);
      showMode(mode);
    },
    undefined,
    (error) => {
      throw error;
    },
  );
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Shift") showMode("hackclub");
});
window.addEventListener("keyup", (event) => {
  if (event.key === "Shift") showMode("jensen");
});
// A released key is never reported to a window without focus.
window.addEventListener("blur", () => showMode("jensen"));
window.addEventListener("resize", resize);
resize();

const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  turntable.rotation.y += timer.getDelta() * TURNTABLE_RADIANS_PER_SECOND;
  composer.render();
});
