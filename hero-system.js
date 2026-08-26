import * as THREE from "three";

const container = document.querySelector(".hero-system");
const canvas = container?.querySelector(".hero-system-canvas");

if (container && canvas) {
  try {
    initHeroSystem(container, canvas);
  } catch {
    // The CSS orbit remains visible when WebGL is unavailable.
  }
}

function initHeroSystem(host, target) {
  const renderer = new THREE.WebGLRenderer({
    canvas: target,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0, 1.4, 8.4);
  camera.lookAt(0, 0, 0);

  const world = new THREE.Group();
  world.rotation.x = -0.08;
  scene.add(world);

  const inkMaterial = new THREE.MeshStandardMaterial({ roughness: 0.58, metalness: 0.18 });
  const accentMaterial = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.35 });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(0.72, 40, 28), inkMaterial);
  world.add(planet);

  const planetRingMaterial = new THREE.MeshBasicMaterial();
  const planetRing = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.025, 8, 96), planetRingMaterial);
  planetRing.rotation.set(1.08, 0.08, -0.22);
  world.add(planetRing);

  const orbitMaterials = [];
  const innerOrbit = createOrbit(1.58, 0.5, -0.3, 0.35);
  const outerOrbit = createOrbit(2.45, -0.22, 0.18, 0.22);
  world.add(innerOrbit.plane, outerOrbit.plane);
  orbitMaterials.push(innerOrbit.material, outerOrbit.material);

  const satellite = createSatellite(inkMaterial, accentMaterial);
  satellite.position.x = 1.58;
  innerOrbit.motion.add(satellite);

  const spacecraft = createSpacecraft(inkMaterial, accentMaterial);
  spacecraft.position.x = 2.45;
  outerOrbit.motion.add(spacecraft);

  const starMaterial = new THREE.PointsMaterial({ size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.7 });
  const starPositions = [];
  for (let index = 0; index < 42; index += 1) {
    const angle = index * 2.39996;
    const radius = 1.8 + (index % 8) * 0.3;
    starPositions.push(
      Math.cos(angle) * radius,
      ((index * 7) % 17) * 0.22 - 1.75,
      Math.sin(angle) * radius - 1.8,
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, starMaterial);
  world.add(stars);

  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x59616c, 2.1);
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
  keyLight.position.set(3, 4, 5);
  scene.add(hemisphere, keyLight);

  const themeMaterials = [inkMaterial, accentMaterial, planetRingMaterial, starMaterial, ...orbitMaterials];
  const applyTheme = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    const ink = dark ? 0xe9e9e3 : 0x171812;
    const accent = dark ? 0x6b9cff : 0x1868ff;
    const orbit = dark ? 0x9b9b94 : 0x666660;

    inkMaterial.color.setHex(ink);
    accentMaterial.color.setHex(accent);
    planetRingMaterial.color.setHex(accent);
    starMaterial.color.setHex(ink);
    orbitMaterials.forEach((material) => material.color.setHex(orbit));
    themeMaterials.forEach((material) => { material.needsUpdate = true; });
  };
  applyTheme();

  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const pointer = { x: 0, y: 0 };
  const handlePointer = (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.34;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.2;
  };
  window.addEventListener("pointermove", handlePointer, { passive: true });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true;
  const render = (time = 0) => {
    const seconds = time * 0.001;
    if (!reducedMotion.matches) {
      planet.rotation.y = seconds * 0.24;
      planet.rotation.x = Math.sin(seconds * 0.35) * 0.05;
      innerOrbit.motion.rotation.y = seconds * 0.72;
      outerOrbit.motion.rotation.y = -seconds * 0.3;
      spacecraft.rotation.y = seconds * 0.55;
      stars.rotation.y = seconds * 0.025;
      world.rotation.y += (pointer.x - world.rotation.y) * 0.025;
      world.rotation.x += (-0.08 - pointer.y - world.rotation.x) * 0.025;
    }
    renderer.render(scene, camera);
  };

  const updateLoop = () => {
    renderer.setAnimationLoop(visible && !reducedMotion.matches ? render : null);
    render();
  };
  reducedMotion.addEventListener("change", updateLoop);

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateLoop();
  });
  visibilityObserver.observe(host);

  const resizeObserver = new ResizeObserver(([entry]) => {
    const width = Math.round(entry.contentRect.width);
    const height = Math.round(entry.contentRect.height);
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  });
  resizeObserver.observe(host);

  render();
  host.classList.add("is-3d");
  updateLoop();
}

function createOrbit(radius, tiltX, tiltZ, opacity) {
  const plane = new THREE.Group();
  plane.rotation.set(tiltX, 0, tiltZ);

  const points = [];
  for (let index = 0; index < 128; index += 1) {
    const angle = (index / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ transparent: true, opacity });
  plane.add(new THREE.LineLoop(geometry, material));

  const motion = new THREE.Group();
  plane.add(motion);
  return { plane, motion, material };
}

function createSatellite(inkMaterial, accentMaterial) {
  const satellite = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.25, 0.28), inkMaterial);
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.035, 0.3), accentMaterial);
  const rightPanel = leftPanel.clone();
  leftPanel.position.x = -0.46;
  rightPanel.position.x = 0.46;
  satellite.add(body, leftPanel, rightPanel);
  satellite.scale.setScalar(0.72);
  return satellite;
}

function createSpacecraft(inkMaterial, accentMaterial) {
  const spacecraft = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.68, 8), inkMaterial);
  body.rotation.x = -Math.PI / 2;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.24), accentMaterial);
  wing.position.z = 0.11;
  spacecraft.add(body, wing);
  spacecraft.scale.setScalar(0.78);
  return spacecraft;
}
