"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { GraphData } from "three-forcegraph";
import * as THREE from "three";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { ForceGraphInstance, GraphLink, GraphNode, RepoGraphProps } from "../../lib/types";

const palette = {
  root: new THREE.Color("#9efeff"),
  directory: new THREE.Color("#ff6ad5"),
  file: new THREE.Color("#7cffe0"),
  hierarchy: new THREE.Color("#2de1fc"),
  mesh: new THREE.Color("#8ef7ff"),
  backdrop: "#05060c",
};

function OrbitControls() {
  const { camera, gl } = useThree();
  const controls = useMemo(() => {
    const instance = new ThreeOrbitControls(camera, gl.domElement);
    instance.enableDamping = true;
    instance.dampingFactor = 0.08;
    instance.rotateSpeed = 0.65;
    instance.zoomSpeed = 0.6;
    instance.autoRotate = false;
    instance.minDistance = 10;
    instance.maxDistance = 180;
    return instance;
  }, [camera, gl.domElement]);

  useEffect(() => () => controls.dispose(), [controls]);

  useFrame(() => controls.update());
  return null;
}

function BloomPass() {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer | null>(null);

  useEffect(() => {
    const effectComposer = new EffectComposer(gl);
    effectComposer.setSize(size.width, size.height);
    effectComposer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.9,
      0.4,
      0.85,
    );
    bloom.threshold = 0.18;
    bloom.strength = 0.85;
    bloom.radius = 0.6;
    effectComposer.addPass(bloom);
    composer.current = effectComposer;

    return () => {
      effectComposer.dispose();
    };
  }, [camera, gl, scene, size.height, size.width]);

  useEffect(() => {
    composer.current?.setSize(size.width, size.height);
  }, [size.height, size.width]);

  useFrame((_, delta) => {
    if (composer.current) {
      composer.current.render(delta);
    }
  }, 1);

  return null;
}

function makeHalo(radius: number, color: THREE.ColorRepresentation) {
  const geometry = new THREE.SphereGeometry(radius, 18, 18);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });
  return new THREE.Mesh(geometry, material);
}

function buildNodeObject(node: GraphNode): THREE.Object3D {
  if (node.type === "directory" || node.type === "root") {
    const radius = node.type === "root" ? 1.4 : 1.0;
    const geometry = new THREE.SphereGeometry(radius, 28, 28);
    const material = new THREE.MeshStandardMaterial({
      color: node.type === "root" ? palette.root : palette.directory,
      emissive: node.type === "root" ? palette.root : palette.directory,
      emissiveIntensity: 0.95,
      metalness: 0.2,
      roughness: 0.35,
    });
    const core = new THREE.Mesh(geometry, material);
    const halo = makeHalo(radius * 1.35, material.color);
    const group = new THREE.Group();
    group.add(core);
    group.add(halo);
    return group;
  }

  const size = 0.7;
  const geometry = new THREE.OctahedronGeometry(size);
  const material = new THREE.MeshStandardMaterial({
    color: palette.file,
    emissive: palette.file,
    emissiveIntensity: 0.9,
    metalness: 0.12,
    roughness: 0.38,
  });
  const mesh = new THREE.Mesh(geometry, material);
  const halo = makeHalo(size * 1.2, palette.file);
  const group = new THREE.Group();
  group.add(mesh);
  group.add(halo);
  return group;
}

function buildLinkObject(
  link: GraphLink,
  materialsStore: MutableRefObject<MeshLineMaterial[]>,
): THREE.Object3D {
  if (link.type === "mesh") {
    const geometry = new MeshLineGeometry();
    const material = new MeshLineMaterial({
      lineWidth: 0.006,
      color: palette.mesh,
      opacity: 0.42,
      dashArray: 0.18,
      dashRatio: 0.45,
      dashOffset: Math.random(),
      resolution:new THREE.Vector2(1920, 1080),
      sizeAttenuation: 1,
    });
    materialsStore.current.push(material);
    return new THREE.Mesh(geometry, material);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
  const material = new THREE.LineBasicMaterial({
    color: palette.hierarchy,
    transparent: true,
    opacity: 0.22,
  });
  return new THREE.Line(geometry, material);
}

function updateLinkObject(
  object: THREE.Object3D,
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  link: GraphLink,
) {
  if (link.type === "mesh" && object instanceof THREE.Mesh && object.geometry instanceof MeshLineGeometry) {
    const points = [start.x, start.y, start.z, end.x, end.y, end.z];
    object.geometry.setPoints(points);
    return;
  }

  if (object instanceof THREE.Line && object.geometry instanceof THREE.BufferGeometry) {
    const position = object.geometry.getAttribute("position") as THREE.BufferAttribute;
    position.setXYZ(0, start.x, start.y, start.z);
    position.setXYZ(1, end.x, end.y, end.z);
    position.needsUpdate = true;
  }
}

function ForceGraphPrimitive({ data }: { data: GraphData<GraphNode, GraphLink> }) {
  const [forceGraph, setForceGraph] = useState<ForceGraphInstance | null>(null);
  const meshMaterials = useRef<MeshLineMaterial[]>([]);

  useEffect(() => {
    let mounted = true;
    let instance: ForceGraphInstance | null = null;

    (async () => {
      const { default: ForceGraph } = await import("three-forcegraph");
      if (!mounted) return;

      instance = new ForceGraph<GraphNode, GraphLink>();
      instance.nodeThreeObject((node) => buildNodeObject(node as GraphNode));
      instance.linkThreeObject((link) => buildLinkObject(link as GraphLink, meshMaterials));
      instance.linkThreeObjectExtend(true);
      instance.linkPositionUpdate((obj, coords, link) => updateLinkObject(obj, coords.start, coords.end, link as GraphLink));
      instance.d3Force("charge")?.strength(-140);
      instance.d3Force("link")?.distance((link: GraphLink & { target?: GraphNode }) => {
        if (link.type === "mesh") return 10;
        if ((link.target as GraphNode | undefined)?.type === "file") return 18;
        return 28;
      });
      instance.numDimensions(3);
      instance.warmupTicks(90);
      instance.cooldownTime(18000);
      instance.graphData(data);
      setForceGraph(instance);
    })();

    return () => {
      mounted = false;
      meshMaterials.current.forEach((mat) => mat.dispose());
      meshMaterials.current = [];
      if (instance) {
        instance.graphData({ nodes: [], links: [] });
      }
    };
  }, [data]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    meshMaterials.current.forEach((material, idx) => {
      material.opacity = 0.28 + 0.22 * Math.sin(t * 1.3 + idx * 0.7);
      material.dashOffset -= 0.0018;
      if (material.dashOffset < -1) material.dashOffset = 0;
    });

    if (forceGraph) {
      // Advance physics simulation
      (forceGraph as unknown as { tickFrame: () => void }).tickFrame();
    }
  });

  return forceGraph ? <primitive object={forceGraph} /> : null;
}

export default function RepoGraph({ data }: RepoGraphProps) {
  return (
    <div className="relative h-screen w-full" style={{ background: palette.backdrop }}>
      <Canvas
        camera={{ position: [36, 22, 36], fov: 55 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(palette.backdrop), 1);
        }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[30, 50, 30]} intensity={1.1} color={palette.root} />
        <pointLight position={[-40, -20, -10]} intensity={0.6} color={palette.directory} />
        <hemisphereLight
          intensity={0.5}
          groundColor="#0b0f1a"
        />

        {data && <ForceGraphPrimitive data={data} />}
        <OrbitControls />
        <BloomPass />
      </Canvas>

      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 38%), radial-gradient(circle at 70% 60%, rgba(124,255,224,0.06), transparent 46%)",
        }}
      />
      <div className="absolute left-6 top-6 space-y-2 text-sm text-[#9efeff] drop-shadow-[0_0_12px_rgba(114,240,255,0.45)]">
        <div className="font-semibold uppercase tracking-[0.18em] text-[#7cffe0]">Repo Visualizer</div>
        <p className="max-w-md text-[#c6f6ff]/80">
          Directories glow as large spheres. Files appear as mirrored pyramids orbiting their folder.
          Sibling files weave neon mesh-lines to form neural clusters.
        </p>
      </div>
    </div>
  );
}
