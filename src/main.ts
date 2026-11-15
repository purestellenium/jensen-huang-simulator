import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { unlockMusic } from "./audio";
import { startOverlay, type Mode } from "./overlay";
import { openSettings } from "./settingsPanel";
import { startGame } from "./game/game";
import { Screensaver } from "./game/screensaver";
import { STRINGS } from "./strings";

const JENSEN_SPRITE_URL = "/images/jensen.png";
const JENSEN_SPRITE_HEIGHT = 1.8;
const OUTLINE_COLOR = "#76b900";
const OUTLINE_THICKNESS = 0.03;
const HACKCLUB_MODEL_URL = "/models/scan.glb";
const HACKCLUB_RESOLUTION = 0.3;
const MIN_RESOLUTION = 0.3;
const MAX_RESOLUTION = 1;
const POSTERIZE_LEVELS = 6;
const TURNTABLE_RADIANS_PER_SECOND = 0.6;

const canvas = document.querySelector<HTMLCanvasElement>("#stage");
if (!canvas) throw new Error("#stage canvas missing");
const overlay = document.querySelector<HTMLCanvasElement>("#overlay");
if (!overlay) throw new Error("#overlay canvas missing");
const doodles = document.querySelector<HTMLCanvasElement>("#doodles");
if (!doodles) throw new Error("#doodles canvas missing");
const backdrop = document.querySelector<HTMLCanvasElement>("#backdrop");
if (!backdrop) throw new Error("#backdrop canvas missing");
const screensaver = new Screensaver(backdrop);
const startButton = document.querySelector<HTMLButtonElement>("#start");
if (!startButton) throw new Error("#start button missing");
const settingsButton = document.querySelector<HTMLButtonElement>("#settings");
if (!settingsButton) throw new Error("#settings button missing");
const secretButton = document.querySelector<HTMLButtonElement>("#secret");
if (!secretButton) throw new Error("#secret button missing");
document.title = STRINGS.document.title;
overlay.setAttribute("aria-label", STRINGS.document.title);
startButton.textContent = STRINGS.title.start;
settingsButton.textContent = STRINGS.title.settings;
secretButton.textContent = STRINGS.title.secret;
const ui = startOverlay(overlay, doodles, startButton, settingsButton, secretButton);

settingsButton.addEventListener("click", () => openSettings(settingsButton));
for (const type of ["pointerdown", "pointerup", "keydown"]) window.addEventListener(type, unlockMusic);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(HACKCLUB_RESOLUTION);

const scene = new THREE.Scene();

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
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
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
let jensenTextureHeight = 305;

function frameCamera(size: THREE.Vector3): void {
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const depth = Math.max(size.x, size.z);
  const fitHeight = size.y / 2 / Math.tan(halfFov);
  const fitWidth = depth / 2 / Math.tan(halfFov) / camera.aspect;
  const distance = Math.max(fitHeight, fitWidth) * 1.15 + depth / 2;
  camera.position.set(0, size.y * 0.05, distance);
  camera.lookAt(0, 0, 0);
}

function resolutionFor(target: Mode): number {
  if (target === "hackclub") return HACKCLUB_RESOLUTION;
  const visibleHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const spritePixels = (JENSEN_SPRITE_HEIGHT / visibleHeight) * window.innerHeight;
  return Math.min(MAX_RESOLUTION, Math.max(MIN_RESOLUTION, jensenTextureHeight / spritePixels));
}

function applyResolution(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const ratio = resolutionFor(mode);
  renderer.setPixelRatio(ratio);
  renderer.setSize(width, height, false);
  composer.setPixelRatio(ratio);
  composer.setSize(width, height);
}

function showMode(next: Mode): void {
  mode = next;
  ui.setMode(next);
  screensaver.setKind(next === "hackclub" ? "cheese" : "gpu");
  for (const [key, model] of Object.entries(models)) {
    model.object.visible = key === next;
  }
  const active = models[next];
  if (active) frameCamera(active.size);
  applyResolution();
}

function resize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.filmOffset = camera.aspect > 1 ? -camera.getFilmWidth() * 0.22 : 0;
  camera.updateProjectionMatrix();
  const active = models[mode];
  if (active) frameCamera(active.size);
  applyResolution();
}

function silhouette(image: HTMLImageElement, color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

new THREE.TextureLoader().load(
  JENSEN_SPRITE_URL,
  (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    const { width, height } = texture.image as { width: number; height: number };
    jensenTextureHeight = height;
    const planeWidth = JENSEN_SPRITE_HEIGHT * (width / height);
    const sprite = new THREE.Mesh(
      new THREE.PlaneGeometry(planeWidth, JENSEN_SPRITE_HEIGHT),
      new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5 }),
    );
    const outlineMaterial = new THREE.MeshBasicMaterial({
      map: silhouette(texture.image as HTMLImageElement, OUTLINE_COLOR),
      alphaTest: 0.5,
    });
    for (const dx of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        if (dx === 0 && dy === 0) continue;
        const outline = new THREE.Mesh(sprite.geometry, outlineMaterial);
        outline.position.set(dx * OUTLINE_THICKNESS, dy * OUTLINE_THICKNESS, -0.01);
        sprite.add(outline);
      }
    }
    scene.add(sprite);
    models.jensen = { object: sprite, size: new THREE.Vector3(planeWidth, JENSEN_SPRITE_HEIGHT, 0) };
    showMode(mode);
  },
  undefined,
  (error) => {
    throw error;
  },
);

new GLTFLoader().load(
  HACKCLUB_MODEL_URL,
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
    const box = new THREE.Box3().setFromObject(object);
    object.position.sub(box.getCenter(new THREE.Vector3()));
    models.hackclub = { object, size: box.getSize(new THREE.Vector3()) };
    turntable.add(object);
    showMode(mode);
  },
  undefined,
  (error) => {
    throw error;
  },
);

let onTitleScreen = true;
window.addEventListener("keydown", (event) => {
  if (onTitleScreen && event.key === "Shift") showMode("hackclub");
});
window.addEventListener("keyup", (event) => {
  if (onTitleScreen && event.key === "Shift") showMode("jensen");
});
window.addEventListener("blur", () => showMode("jensen"));
window.addEventListener("resize", resize);
resize();

const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  turntable.rotation.y += timer.getDelta() * TURNTABLE_RADIANS_PER_SECOND;
  composer.render();
});

startButton.addEventListener("click", () => {
  onTitleScreen = false;
  ui.stop();
  renderer.setAnimationLoop(null);
  for (const node of [backdrop, canvas, overlay, doodles, document.querySelector("main")]) {
    if (node) node.hidden = true;
  }
  const game = document.querySelector<HTMLElement>("#game");
  if (!game) throw new Error("#game missing");
  game.hidden = false;
  void startGame(game);
});
