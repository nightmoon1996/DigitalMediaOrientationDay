import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
const Galaxy = () => {
  const ref = useRef();

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      100
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.autoClear = false;
    renderer.logarithmicDepthBuffer = false;
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    renderer.setPixelRatio(
      isIOS ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio
    );

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    });

    camera.position.z = 3;
    camera.position.y = 2;
    camera.position.x = 0;

    camera.rotation.x = -0.5;
    camera.rotation.y = 0;
    camera.rotation.z = 0.1;

    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      window.innerWidth > 480 ? 1.5 : 0.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.4;
    bloomPass.strength = 2;
    bloomPass.radius = 0.9;

    const bokehPass = new BokehPass(scene, camera, {
      focus: 100,
      aperture: 0.005,
      maxblur: 0.018,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const sSAOPass = new SSAOPass(
      scene,
      camera,
      window.innerWidth,
      window.innerHeight
    );
    sSAOPass.kernelRadius = 16;
    sSAOPass.minDistance = 0.005;
    sSAOPass.maxDistance = 0.1;

    const outputPass = new OutputPass();

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    if (!isMobile) {
      if (!isIOS) {
        composer.addPass(bokehPass);
        composer.addPass(sSAOPass);
      }
    }
    composer.addPass(outputPass);

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    ref.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 3;
    controls.minPolarAngle = Math.PI / 4;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 10;

    scene.add(new THREE.AmbientLight(0x404040));
    // **Galaxy Generation**
    const parameters = {
      count: 50000, // Number of stars
      size: 0.01, // Size of individual stars
      radius: 5, // Radius of the galaxy
      branches: 8, // Number of spiral arms
      spin: 1, // Spin rate
      randomness: 0.2, // Randomness in star positions
      randomnessPower: 3, // Intensity of randomness
      insideColor: 0xff6030, // Color of center
      outsideColor: 0x1b3984, // Color at edge
    };

    let geometry = null;
    let material = null;
    let points = null;

    const generateGalaxy = () => {
      geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(parameters.count * 3);
      const colors = new Float32Array(parameters.count * 3);

      const colorInside = new THREE.Color(parameters.insideColor);
      const colorOutside = new THREE.Color(parameters.outsideColor);

      for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3;
        const radius = Math.random() * parameters.radius;
        const spinAngle = radius * parameters.spin;
        const branchAngle =
          ((i % parameters.branches) / parameters.branches) * Math.PI * 2;
        const randomX =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness *
          radius;
        const randomY =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness *
          radius;
        const randomZ =
          Math.pow(Math.random(), parameters.randomnessPower) *
          (Math.random() < 0.5 ? 1 : -1) *
          parameters.randomness *
          radius;

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] =
          Math.sin(branchAngle + spinAngle) * radius + randomZ;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / parameters.radius);

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
      }

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      material = new THREE.PointsMaterial({
        color: 0xffffff,
        opacity: 0.4,
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);
    };

    generateGalaxy();

    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the galaxy slowly
      scene.rotation.y += 0.0005;

      renderer.clear();
      controls.update();
      composer.render(scene, camera);
    };

    animate();

    // For responsiveness
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
  }, []);

  return <div ref={ref}></div>;
};

export default Galaxy;
