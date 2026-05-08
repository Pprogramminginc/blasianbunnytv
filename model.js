import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const modelStage = document.querySelector("[data-bunny-model]");
const canvas = document.querySelector("[data-bunny-canvas]");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

if (modelStage && canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
    powerPreference: "high-performance",
  });
  const group = new THREE.Group();
  const loader = new GLTFLoader();

  scene.add(group);
  camera.position.set(0, 0.08, 4.1);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(3, 4, 4);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffc3d6, 1.2);
  fillLight.position.set(-4, 1.5, 2);
  scene.add(fillLight);

  scene.add(new THREE.AmbientLight(0xffffff, 1.8));

  const resizeRenderer = () => {
    const { width, height } = modelStage.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const frameModel = (model) => {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;

    model.position.sub(center);
    model.scale.setScalar(3.25 / maxAxis);
    model.rotation.set(0.08, 0.78, 0);
    group.position.set(-0.28, 0.02, 0);
  };

  loader.load(
    "bunny.glb",
    (gltf) => {
      const model = gltf.scene;

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      group.add(model);
      frameModel(model);
      resizeRenderer();
      renderer.render(scene, camera);

      if (!motionQuery.matches) {
        let lastTime = 0;

        const animate = (time) => {
          const delta = Math.min((time - lastTime) / 1000, 0.033);
          lastTime = time;
          group.rotation.z = Math.sin(time * 0.0012) * 0.025;
          group.position.y = 0.02 + Math.sin(time * 0.0016) * 0.025;
          renderer.render(scene, camera);
          window.requestAnimationFrame(animate);
        };

        window.requestAnimationFrame(animate);
      }
    },
    undefined,
    () => {
      modelStage.classList.add("is-unavailable");
    },
  );

  window.addEventListener("resize", resizeRenderer);
  resizeRenderer();
}
