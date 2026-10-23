import * as THREE from "three";

function roundedHexPath(radius: number, corner: number, reverse = false) {
  const points = Array.from({ length: 6 }, (_, index) => {
    const angle = (index * Math.PI) / 3;
    return new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius);
  });

  if (reverse) points.reverse();

  const path = reverse ? new THREE.Path() : new THREE.Shape();
  const toward = (from: THREE.Vector2, to: THREE.Vector2) =>
    from.clone().add(to.clone().sub(from).setLength(corner));

  const start = toward(points[0], points[points.length - 1]);
  path.moveTo(start.x, start.y);

  points.forEach((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const incoming = toward(point, previous);
    const outgoing = toward(point, next);

    path.lineTo(incoming.x, incoming.y);
    path.quadraticCurveTo(point.x, point.y, outgoing.x, outgoing.y);
  });

  path.lineTo(start.x, start.y);
  return path;
}

function hexExtrusion(radius: number, depth: number, bevel: number, corner: number, holeRadius?: number) {
  const shape = roundedHexPath(radius, corner) as THREE.Shape;

  if (holeRadius) {
    shape.holes.push(roundedHexPath(holeRadius, corner * 0.65, true));
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    curveSegments: 8,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
  });

  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function addPart(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  y: number,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addLowerMetalAccent(parent: THREE.Group) {
  const front = Math.sin(Math.PI / 3) * 2.08;
  const points = [
    [-0.91, 0.39, front + 0.137],
    [-0.66, 0.43, front + 0.137],
    [-0.36, 0.34, front + 0.137],
    [0.1, 0.115, front + 0.123],
    [-0.13, 0.028, front + 0.023],
    [-0.91, 0.028, front + 0.023],
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]);
  geometry.computeVertexNormals();

  const accent = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: "#e9eae5",
      metalness: 0.28,
      roughness: 0.34,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      side: THREE.DoubleSide,
    }),
  );
  accent.castShadow = true;
  parent.add(accent);
  return accent;
}

export function createMintHexParts() {
  const object = new THREE.Group();
  object.name = "Mint glass hexagonal object";

  const glassTop = new THREE.MeshPhysicalMaterial({
    color: "#9dbda4",
    metalness: 0.02,
    roughness: 0.34,
    transmission: 0.13,
    thickness: 0.7,
    ior: 1.32,
    attenuationColor: "#87ad91",
    attenuationDistance: 3.5,
    clearcoat: 0.9,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.25,
  });

  const glassSide = new THREE.MeshPhysicalMaterial({
    color: "#78a887",
    metalness: 0.015,
    roughness: 0.27,
    transmission: 0.31,
    thickness: 1.15,
    ior: 1.35,
    attenuationColor: "#639675",
    attenuationDistance: 2.7,
    clearcoat: 1,
    clearcoatRoughness: 0.13,
    envMapIntensity: 1.35,
  });

  const bottomTop = glassTop.clone();
  bottomTop.color.set("#91b399");
  const bottomSide = glassSide.clone();
  bottomSide.color.set("#6f9e7d");

  const brushedMetal = new THREE.MeshStandardMaterial({
    color: "#aeb5aa",
    metalness: 0.56,
    roughness: 0.37,
    envMapIntensity: 1.3,
  });
  const brightMetal = new THREE.MeshStandardMaterial({
    color: "#c7cec3",
    metalness: 0.36,
    roughness: 0.3,
    envMapIntensity: 1.5,
  });
  const insideMetal = new THREE.MeshStandardMaterial({
    color: "#929b91",
    metalness: 0.28,
    roughness: 0.44,
    envMapIntensity: 0.9,
  });

  const bottom = new THREE.Group();
  addPart(bottom, hexExtrusion(2.08, 1.19, 0.13, 0.24), [bottomTop, bottomSide], 0.15);
  object.add(bottom);

  const metalRim = new THREE.Group();
  addPart(metalRim, hexExtrusion(2.2, 0.2, 0.035, 0.23), brushedMetal, 1.37);
  object.add(metalRim);

  const glassBody = new THREE.Group();
  const accentMesh = addLowerMetalAccent(glassBody);
  addPart(glassBody, hexExtrusion(2.08, 1.25, 0.12, 0.24), [glassTop, glassSide], 1.58);
  object.add(glassBody);

  const socket = new THREE.MeshStandardMaterial({
    color: "#718f78",
    metalness: 0.1,
    roughness: 0.36,
  });
  const socketGroup = new THREE.Group();
  addPart(socketGroup, hexExtrusion(1.24, 0.013, 0.006, 0.115, 1.11), socket, 2.952);
  object.add(socketGroup);

  const innerRing = new THREE.Group();
  addPart(innerRing, hexExtrusion(1.15, 0.13, 0.025, 0.105, 0.835), [brightMetal, insideMetal], 2.965);
  object.add(innerRing);

  const innerCap = new THREE.Group();
  addPart(innerCap, hexExtrusion(0.837, 0.012, 0.003, 0.075), insideMetal, 2.959);
  object.add(innerCap);

  const topCap = new THREE.Group();
  addPart(
    topCap,
    hexExtrusion(0.785, 0.006, 0.002, 0.07),
    new THREE.MeshStandardMaterial({
      color: "#b0b8ad",
      metalness: 0.12,
      roughness: 0.68,
      envMapIntensity: 0.65,
    }),
    2.976,
  );
  object.add(topCap);

  return {
    object,
    parts: { bottom, metalRim, glassBody, socket: socketGroup, innerRing, innerCap, topCap },
    accentMesh,
  };
}

export function createMintHexObject() {
  return createMintHexParts().object;
}

export function disposeMintHexObject(object: THREE.Group) {
  const materials = new Set<THREE.Material>();

  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const meshMaterials = Array.isArray(child.material) ? child.material : [child.material];
    meshMaterials.forEach((material) => materials.add(material));
  });

  materials.forEach((material) => material.dispose());
}
