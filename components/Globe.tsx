'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Coordinate = { lat: number; lng: number };

type GlobeProps = {
  guess: Coordinate | null;
  target: Coordinate | null;
  interactive: boolean;
  onPlacePin: (coordinate: Coordinate) => void;
};

const RADIUS = 2.85;
const TEXTURE_URL = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';

function latLngToVector3(lat: number, lng: number, radius = RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function vector3ToLatLng(point: THREE.Vector3) {
  const normalized = point.clone().normalize();
  const lat = 90 - (Math.acos(normalized.y) * 180) / Math.PI;
  const lng = ((Math.atan2(normalized.z, -normalized.x) * 180) / Math.PI) - 180;
  return { lat, lng: lng < -180 ? lng + 360 : lng };
}

function createPin(color: number, size: number) {
  const group = new THREE.Group();
  const point = new THREE.Mesh(
    new THREE.SphereGeometry(size, 16, 16),
    new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 1 }),
  );
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(size * 2.1, size * 2.45, 32),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.68, depthTest: false }),
  );
  ring.rotation.x = Math.PI / 2;
  group.add(point, ring);
  group.renderOrder = 20;
  group.visible = false;
  return group;
}

export default function Globe({ guess, target, interactive, onPlacePin }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const guessRef = useRef<Coordinate | null>(guess);
  const targetRef = useRef<Coordinate | null>(target);
  const interactiveRef = useRef(interactive);
  const onPlacePinRef = useRef(onPlacePin);

  useEffect(() => { guessRef.current = guess; }, [guess]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { interactiveRef.current = interactive; }, [interactive]);
  useEffect(() => { onPlacePinRef.current = onPlacePin; }, [onPlacePin]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.25, 8.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    globe.rotation.x = -0.1;
    scene.add(globe);

    const ambient = new THREE.AmbientLight(0x8ea78b, 1.2);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xdce7bc, 2.3);
    sun.position.set(-4, 5, 6);
    scene.add(sun);

    const earthMaterial = new THREE.MeshPhongMaterial({ color: 0x466a50, shininess: 18, specular: 0x263f32 });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 96, 96), earthMaterial);
    earth.name = 'earth';
    globe.add(earth);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.055, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x9dbd96, side: THREE.BackSide, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending }),
    );
    globe.add(atmosphere);

    const guessPin = createPin(0xf4a260, 0.075);
    const targetPin = createPin(0xe3f77a, 0.09);
    globe.add(guessPin, targetPin);

    const lineMaterial = new THREE.LineDashedMaterial({ color: 0xf4a260, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.9, depthTest: false });
    const line = new THREE.Line(new THREE.BufferGeometry(), lineMaterial);
    line.visible = false;
    line.renderOrder = 10;
    globe.add(line);

    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(520 * 3);
    for (let i = 0; i < 520; i += 1) {
      const radius = 13 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0x9bb397, size: 0.045, transparent: true, opacity: 0.65, sizeAttenuation: true }));
    scene.add(stars);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(TEXTURE_URL, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      earthMaterial.map = texture;
      earthMaterial.color.set(0xffffff);
      earthMaterial.needsUpdate = true;
    });

    let width = container.clientWidth;
    let height = container.clientHeight;
    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerStart = new THREE.Vector2();
    const pointers = new Map<number, { x: number; y: number }>();
    let wasDragging = false;
    let pinchDistance = 0;

    const getPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const placeFromPointer = (event: PointerEvent) => {
      if (!interactiveRef.current || wasDragging) return;
      getPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(earth, false)[0];
      if (!hit) return;
      const localPoint = globe.worldToLocal(hit.point.clone());
      onPlacePinRef.current(vector3ToLatLng(localPoint));
    };

    const onPointerDown = (event: PointerEvent) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      renderer.domElement.setPointerCapture(event.pointerId);
      pointerStart.set(event.clientX, event.clientY);
      wasDragging = false;
      if (pointers.size === 2) {
        const values = [...pointers.values()];
        pinchDistance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const distanceFromStart = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      if (distanceFromStart > 5) wasDragging = true;

      if (pointers.size === 2) {
        const values = [...pointers.values()];
        const nextDistance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
        if (pinchDistance > 0) camera.position.z = THREE.MathUtils.clamp(camera.position.z - (nextDistance - pinchDistance) * 0.012, 5.8, 11);
        pinchDistance = nextDistance;
        return;
      }

      if (!interactiveRef.current || !wasDragging) return;
      globe.rotation.y += (event.clientX - previous.x) * 0.006;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + (event.clientY - previous.y) * 0.004, -0.8, 0.8);
    };

    const onPointerUp = (event: PointerEvent) => {
      placeFromPointer(event);
      pointers.delete(event.pointerId);
      pinchDistance = 0;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.006, 5.8, 11);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    let frame = 0;
    let lastTime = performance.now();
    let lastTargetId = '';
    let flight: { start: number; from: number; to: number; duration: number } | null = null;

    const updatePins = () => {
      const currentGuess = guessRef.current;
      const currentTarget = targetRef.current;
      if (currentGuess) {
        guessPin.position.copy(latLngToVector3(currentGuess.lat, currentGuess.lng, RADIUS * 1.02));
        guessPin.visible = true;
      } else {
        guessPin.visible = false;
      }
      if (currentTarget) {
        targetPin.position.copy(latLngToVector3(currentTarget.lat, currentTarget.lng, RADIUS * 1.04));
        targetPin.visible = true;
        if (currentGuess) {
          const points = [
            latLngToVector3(currentGuess.lat, currentGuess.lng, RADIUS * 1.04),
            latLngToVector3(currentTarget.lat, currentTarget.lng, RADIUS * 1.04),
          ];
          line.geometry.dispose();
          line.geometry = new THREE.BufferGeometry().setFromPoints(points);
          line.computeLineDistances();
          line.visible = true;
        }
        const targetId = `${currentTarget.lat}:${currentTarget.lng}`;
        if (targetId !== lastTargetId) {
          const targetVector = latLngToVector3(currentTarget.lat, currentTarget.lng, 1).normalize();
          const desiredY = Math.atan2(-targetVector.x, targetVector.z);
          flight = { start: performance.now(), from: globe.rotation.y, to: globe.rotation.y + THREE.MathUtils.euclideanModulo(desiredY - globe.rotation.y + Math.PI, Math.PI * 2) - Math.PI, duration: 1600 };
          lastTargetId = targetId;
        }
      } else {
        targetPin.visible = false;
        line.visible = false;
        lastTargetId = '';
      }
    };

    const render = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      updatePins();
      if (!interactiveRef.current && !flight) globe.rotation.y += delta * 0.045;
      if (flight) {
        const progress = Math.min(1, (now - flight.start) / flight.duration);
        const eased = 1 - (1 - progress) ** 3;
        globe.rotation.y = THREE.MathUtils.lerp(flight.from, flight.to, eased);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 7.2, 0.035);
        camera.lookAt(0, 0, 0);
        if (progress >= 1) flight = null;
      }
      stars.rotation.y += delta * 0.008;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      earth.geometry.dispose();
      earthMaterial.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className={`globe-stage ${interactive ? 'globe-stage--interactive' : 'globe-stage--locked'}`} aria-label="Interactive 3D globe" />;
}
