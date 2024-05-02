import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import planetData from "./planetData.json";
import jsQR from "jsqr";
import { useSpring, animated } from "@react-spring/web";
// import { GeistSans } from "geist/font/sans";
// import { GeistMono } from "geist/font/mono";

const Galaxy = () => {
  const ref = useRef();
  const videoRef = useRef();
  const [qrScanOpen, setQrScanOpen] = useState(false);
  const [scannedStamps, setScannedStamps] = useState([]);
  const [qrValue, setQrValue] = useState(null);
  const [qrError, setQrError] = useState(null);

  const slideAnimation = useSpring({
    from: { height: 0 },
    to: { height: qrScanOpen ? "50vh" : 0 },
    config: { duration: 500 },
  });

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, depth: true });
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

    camera.position.z = 0;
    camera.position.y = 0;
    camera.position.x = 0;

    camera.rotation.x = 0;
    camera.rotation.y = 0;
    camera.rotation.z = 0;

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

    let planets = [];

    // loop through colors and create a planet for each
    for (let i = 0; i < planetData.planets.length; i++) {
      const planetInfo = planetData.planets[i];
      const planetGeometry = new THREE.SphereGeometry(0.2, 32, 32);
      const planetMaterial = new THREE.MeshBasicMaterial({
        color: 0x48cf48,
      });
      const planet = new THREE.Mesh(planetGeometry, planetMaterial);

      // set position of the planet
      planet.position.set(
        planetInfo.position.x,
        planetInfo.position.y,
        planetInfo.position.z
      );

      // set type of the planet
      planet.type = planetInfo.type;

      scene.add(planet);
      planets.push(planet);
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let selectedPlanet = null;
    let scaleTimeout = null;

    window.addEventListener("mousedown", (event) => {
      event.preventDefault();

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(planets);

      if (intersects.length > 0) {
        selectedPlanet = intersects[0].object;
      }

      for (let i = 0; i < intersects.length; i++) {
        // show description box
        const descriptionBox = document.getElementById("description-box");
        const titleElement = document.getElementById("title");
        const descriptionElement = document.getElementById("description");
        const imageElement = document.getElementById("image");
        descriptionBox.style.display = "block";
        titleElement.textContent = selectedPlanet.type;

        const planetInfo = planetData.planets.find(
          (planet) => planet.type === selectedPlanet.type
        );
        if (planetInfo) {
          descriptionElement.textContent = planetInfo.description;
        }

        imageElement.src = `./images/${selectedPlanet.type}.png`;
      }
    });

    scene.add(new THREE.AmbientLight(0x404040));

    // **Galaxy Generation**
    const parameters = {
      count: isMobile ? 25000 : 50000, // Number of stars
      size: 0.01, // Size of individual stars
      radius: 5, // Radius of the galaxy
      branches: 8, // Number of spiral arms
      spin: 1, // Spin rate
      randomness: 0.2, // Randomness in star positions
      randomnessPower: 3, // Intensity of randomness
      insideColor: 0x48cf48, // Color of center 0xff7308, 0x48cf48
      outsideColor: 0x882de3, // Color at edge 0xd303fc, 0xffb3fc
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

    const descriptionBox = document.getElementById("description-box");

    const animate = () => {
      requestAnimationFrame(animate);

      if (selectedPlanet) {
        selectedPlanet.scale.lerp(new THREE.Vector3(1.5, 1.5, 1.5), 0.1);
        // const targetPosition = selectedPlanet.position.clone();
        // targetPosition.z += 4;
        // camera.position.lerp(targetPosition, 0.02);
        // camera.lookAt(selectedPlanet.position);

        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(selectedPlanet.matrixWorld);
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

        descriptionBox.style.left = `${x}px`;
        descriptionBox.style.top = `${y}px`;
        descriptionBox.style.opacity = "1";
        if (scaleTimeout) {
          clearTimeout(scaleTimeout);
        }
      }

      // Rotate the galaxy slowly
      scene.rotation.y += 0.0005;

      renderer.clear();
      controls.update();

      composer.render(scene, camera);
    };

    // const canvas = document.createElement("canvas");

    // let scanning = false;

    // const tick = () => {
    //   if (
    //     videoRef.current &&
    //     videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
    //   ) {
    //     canvas.height = videoRef.current.videoHeight;
    //     canvas.width = videoRef.current.videoWidth;
    //     const context = canvas.getContext("2d");
    //     context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    //     const imageData = context.getImageData(
    //       0,
    //       0,
    //       canvas.width,
    //       canvas.height
    //     );
    //     const code = jsQR(imageData.data, imageData.width, imageData.height);

    //     if (code) {
    //       handleScan(code.data);
    //       scanning = false;
    //     }
    //   }

    //   if (scanning) {
    //     requestAnimationFrame(tick);
    //   }
    // };

    // const startScanning = () => {
    //   navigator.mediaDevices
    //     .getUserMedia({ video: { facingMode: "environment" } })
    //     .then((stream) => {
    //       videoRef.current.srcObject = stream;
    //       videoRef.current.setAttribute("playsinline", true);
    //       videoRef.current.play();
    //       scanning = true;
    //       requestAnimationFrame(tick);
    //     })
    //     .catch((err) => console.error("Error accessing camera: ", err));
    // };

    // const stopScanning = () => {
    //   scanning = false;
    //   if (videoRef.current && videoRef.current.srcObject) {
    //     videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    //   }
    // };

    // startScanning();

    animate();
    // For responsiveness
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // const swipeUpArea = document.getElementById("swipe-up-area");
    // const qrScanContainer = document.getElementById("qr-scan-container");

    // let touchStartY = null;

    // const handleTouchStart = (event) => {
    //   touchStartY = event.touches[0].clientY;
    // };

    // const handleTouchMove = (event) => {
    //   if (touchStartY) return;

    //   const touchEndY = event.touches[0].clientY;
    //   const distance = touchStartY - touchEndY;

    //   if (distance > 50) {
    //     setQrScanOpen(true);
    //     touchStartY = null;
    //   }
    // };

    // swipeUpArea.addEventListener("touchstart", handleTouchStart);
    // swipeUpArea.addEventListener("touchmove", handleTouchMove);

    return () => {
      // swipeUpArea.removeEventListener("touchstart", handleTouchStart);
      // swipeUpArea.removeEventListener("touchmove", handleTouchMove);
      // stopScanning();
    };
  }, []);

  // const handleSwipeUp = () => {
  //   setQrScanOpen(true);
  // };

  // const handleScan = (data) => {
  //   if (data) {
  //     setQrValue(data);
  //     setQrError(null);

  //     if (!scannedStamps.includes(data)) {
  //       setScannedStamps([...scannedStamps, data]);

  //       alert(
  //         "New stamp collected! You now have ${scannedStamps.length} out of 5 stamps"
  //       );
  //     } else {
  //       alert("You have already collected this stamp!");
  //     }
  //   }
  // };

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          color: "white",
          top: "10px",
          left: "10px",
          fontSize: "2em",
          zIndex: 1,
          fontFamily: "sans-serif",
        }}
      >
        Project Orientation Day <br />
        DEV Test Build 1.1 <br />
        Disclaimer: ห้ามถ่ายลง Social Media โดยไม่ได้รับอนุญาต
      </div>
      <div
        id="description-box"
        style={{
          width: isMobile ? "60vw" : "15vw",
          height: isMobile ? "35vh" : "15vh",
          overflow: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::WebkitScrollbar": {
            display: "none" /* For Chrome, Safari and Opera */,
          },
          display: "none",
          position: "absolute",
          right: "-10px",
          top: "50%",
          transform: "translateY(-50%)",
          transition: "opacity 0.5s ease-in-out",
          opacity: 0,
          zIndex: 2,
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "10px",
          borderRadius: "10px",
          fontFamily: "sans-serif",
        }}
      >
        <button
          style={{
            position: "absolute",
            right: "10px",
            top: "10px",
            color: "white",
            backgroundColor: "transparent",
            border: "none",
          }}
          onClick={() => {
            const descriptionBox = document.getElementById("description-box");
            descriptionBox.style.display = "none";
            descriptionBox.style.opacity = "0";
          }}
        >
          X
        </button>
        <h1 id="title" style={{ color: "white" }}>
          Title
        </h1>
        <p id="description" style={{ color: "white" }}>
          Description
        </p>
        <img id="image" src="" alt="Planet" style={{ width: "50px" }} />
      </div>
      <div
        id="swipe-up-area"
        style={{
          position: "fixed",
          bottom: "0",
          left: "0",
          width: "100%",
          height: "50px",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          textAlign: "center",
          lineHeight: "50px",
          fontFamily: "sans-serif",
        }}
      >
        Swipe Up to Scan QR Code
      </div>

      <animated.div
        id="qr-scan-container"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          height: slideAnimation.height,
          backgroundColor: "white",
          overflow: "hidden",
          transition: "height 0.5s ease-in-out",
          zIndex: 3,
        }}
      ></animated.div>
    </div>
  );
};

export default Galaxy;
