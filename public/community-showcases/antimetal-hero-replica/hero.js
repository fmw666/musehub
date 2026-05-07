// 1:1 reproduction of antimetal.com hero "DottedVideo" component.
// Source: reverse-engineered from the production bundle (module 901116).
//
// Pipeline per frame:
//   1. mouse splat -> velocity & dye textures
//   2. curl  -> vorticity confinement
//   3. divergence
//   4. clear pressure (* dissipation)
//   5. pressure jacobi iteration N times
//   6. gradient subtract -> divergence-free velocity
//   7. advect velocity (with dissipation)
//   8. advect dye (with dissipation)
//   9. display: video + dye -> halftone dot grid -> screen
//
// Three.js is bundled locally as ./three-vendor.js so the showcase has zero
// remote dependencies.

import * as THREE from "./three-vendor.js";
import {
  baseVert,
  fluidVert,
  clearFrag,
  splatFrag,
  advectFrag,
  divergenceFrag,
  curlFrag,
  vorticityFrag,
  pressureFrag,
  gradientSubtractFrag,
  displayFrag,
} from "./shaders.js";

// === defaultShaderConfig (from module 419420 in original bundle) ===
export const defaultShaderConfig = {
  dotsEnabled: true,
  dotSize: 8,
  minDotSize: 1,
  dotMargin: 0,
  dotColor: "#e0f6ff",
  dotAlphaMultiplier: 1,
  videoSource: "./video.mp4",
  maskSrc: "./video-mask.avif",
  gridLayout: "straight", // "straight" | "radial" | "alternating-grid"
  enableMask: false,
  animSpeed: 4,
  gamma: 0.9,
  backgroundColor: "#000000",
  loopAt: 4,
  disableFluid: false,
  fluidCurl: 100,
  fluidVelocityDissipation: 0.93,
  fluidDyeDissipation: 0.95,
  fluidSplatRadius: 0.006,
  fluidPressureIterations: 1,
  fluidStrength: 0.15,
  baseFPS: 60,
  disabledOnMobile: false,
};

const GRID_LAYOUTS = { straight: 0, radial: 1, "alternating-grid": 2 };

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? {
        r: parseInt(m[1], 16) / 255,
        g: parseInt(m[2], 16) / 255,
        b: parseInt(m[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
}

// Double-buffered render target (for ping-ponging fluid simulation)
function makeDoubleRT(width, height) {
  const opts = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  };
  return {
    read: new THREE.WebGLRenderTarget(width, height, opts),
    write: new THREE.WebGLRenderTarget(width, height, opts),
    swap() {
      const t = this.read;
      this.read = this.write;
      this.write = t;
    },
  };
}

function makeRT(width, height) {
  return new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export function createDottedVideo(container, userConfig = {}) {
  const config = { ...defaultShaderConfig, ...userConfig };

  // === video element ===
  const video = document.createElement("video");
  video.src = config.videoSource;
  video.loop = false;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.load();
  video.addEventListener("ended", () => {
    video.currentTime = config.loopAt;
    video.play().catch((e) => e);
  });

  // === textures ===
  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBAFormat;

  const maskTexture = new THREE.TextureLoader().load(config.maskSrc);
  maskTexture.minFilter = THREE.LinearFilter;
  maskTexture.magFilter = THREE.LinearFilter;
  maskTexture.format = THREE.RGBAFormat;

  // === renderer ===
  const width = container.clientWidth;
  const height = container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  container.appendChild(renderer.domElement);

  // === fluid simulation grid (half resolution, like antimetal) ===
  const simW = Math.floor(width / 2);
  const simH = Math.floor(height / 2);

  // Fluid scene (offscreen)
  let fluidScene = null;
  let fluidCamera = null;
  let fluidQuad = null;
  let velocityRT = null;
  let dyeRT = null;
  let pressureRT = null;
  let divergenceRT = null;
  let curlRT = null;
  let texelSize = null;

  // Materials
  let clearMat = null,
    splatMat = null,
    advectMat = null,
    divergenceMat = null,
    curlMat = null,
    vorticityMat = null,
    pressureMat = null,
    gradientSubtractMat = null;

  if (!config.disableFluid) {
    fluidScene = new THREE.Scene();
    fluidCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    fluidQuad = new THREE.PlaneGeometry(2, 2);
    velocityRT = makeDoubleRT(simW, simH);
    dyeRT = makeDoubleRT(simW, simH);
    pressureRT = makeDoubleRT(simW, simH);
    divergenceRT = makeRT(simW, simH);
    curlRT = makeRT(simW, simH);
    texelSize = new THREE.Vector2(1 / simW, 1 / simH);

    const aspectRatio = width / height;

    clearMat = new THREE.ShaderMaterial({
      vertexShader: baseVert,
      fragmentShader: clearFrag,
      uniforms: { uTexture: { value: null }, value: { value: 0.98 } },
    });
    splatMat = new THREE.ShaderMaterial({
      vertexShader: baseVert,
      fragmentShader: splatFrag,
      uniforms: {
        uTarget: { value: null },
        aspectRatio: { value: aspectRatio },
        color: { value: new THREE.Vector3(0, 0, 0) },
        point: { value: new THREE.Vector2(0, 0) },
        radius: { value: config.fluidSplatRadius },
      },
    });
    advectMat = new THREE.ShaderMaterial({
      vertexShader: baseVert,
      fragmentShader: advectFrag,
      uniforms: {
        uVelocity: { value: null },
        uSource: { value: null },
        texelSize: { value: texelSize },
        dt: { value: 0.016 },
        dissipation: { value: 0.98 },
      },
    });
    divergenceMat = new THREE.ShaderMaterial({
      vertexShader: fluidVert,
      fragmentShader: divergenceFrag,
      uniforms: { uVelocity: { value: null }, texelSize: { value: texelSize } },
    });
    curlMat = new THREE.ShaderMaterial({
      vertexShader: fluidVert,
      fragmentShader: curlFrag,
      uniforms: { uVelocity: { value: null }, texelSize: { value: texelSize } },
    });
    vorticityMat = new THREE.ShaderMaterial({
      vertexShader: fluidVert,
      fragmentShader: vorticityFrag,
      uniforms: {
        uVelocity: { value: null },
        uCurl: { value: null },
        curl: { value: config.fluidCurl },
        dt: { value: 0.016 },
        texelSize: { value: texelSize },
      },
    });
    pressureMat = new THREE.ShaderMaterial({
      vertexShader: fluidVert,
      fragmentShader: pressureFrag,
      uniforms: {
        uPressure: { value: null },
        uDivergence: { value: null },
        texelSize: { value: texelSize },
      },
    });
    gradientSubtractMat = new THREE.ShaderMaterial({
      vertexShader: fluidVert,
      fragmentShader: gradientSubtractFrag,
      uniforms: {
        uPressure: { value: null },
        uVelocity: { value: null },
        texelSize: { value: texelSize },
      },
    });
  }

  // === display (final composite) ===
  const cellSize = config.dotSize + config.dotMargin;
  const gridLayoutId = GRID_LAYOUTS[config.gridLayout] ?? 0;
  const dotRgb = hexToRgb(config.dotColor);

  const displayMaterial = new THREE.ShaderMaterial({
    vertexShader: baseVert,
    fragmentShader: displayFrag,
    uniforms: {
      uDye: { value: null },
      uVideo: { value: videoTexture },
      uMask: { value: maskTexture },
      enableMask: { value: config.enableMask },
      fluidStrength: { value: config.fluidStrength },
      gridCellSize: { value: cellSize },
      gridLayout: { value: gridLayoutId },
      dotRadius: { value: config.dotSize / 2 },
      minDotRadius: { value: config.minDotSize / 2 },
      videoResolution: { value: new THREE.Vector2(width, height) },
      time: { value: 0 },
      animSpeed: { value: config.animSpeed },
      gamma: { value: config.gamma },
      dotColor: { value: new THREE.Vector3(dotRgb.r, dotRgb.g, dotRgb.b) },
      dotAlphaMultiplier: { value: config.dotAlphaMultiplier },
      dotsEnabled: { value: config.dotsEnabled },
    },
    transparent: true,
  });

  const displayScene = new THREE.Scene();
  const displayCamera = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    0.1,
    1000,
  );
  displayCamera.position.z = 1;
  let displayGeometry = new THREE.PlaneGeometry(width, height);
  const displayMesh = new THREE.Mesh(displayGeometry, displayMaterial);
  displayScene.add(displayMesh);

  let fluidMesh = null;
  if (!config.disableFluid && fluidScene) {
    fluidMesh = new THREE.Mesh(fluidQuad, new THREE.MeshBasicMaterial());
    fluidScene.add(fluidMesh);
  }

  const blit = config.disableFluid
    ? null
    : (material, target) => {
        fluidMesh.material = material;
        renderer.setRenderTarget(target);
        renderer.render(fluidScene, fluidCamera);
      };

  const splat = config.disableFluid
    ? null
    : ({ x, y, dx, dy, color }) => {
        const point = new THREE.Vector2(x / width, 1 - y / height);
        splatMat.uniforms.uTarget.value = velocityRT.read.texture;
        splatMat.uniforms.point.value = point;
        splatMat.uniforms.color.value.set(dx, -dy, 0);
        splatMat.uniforms.radius.value = 0.003;
        blit(splatMat, velocityRT.write);
        velocityRT.swap();

        splatMat.uniforms.uTarget.value = dyeRT.read.texture;
        splatMat.uniforms.color.value = color;
        splatMat.uniforms.radius.value = config.fluidSplatRadius;
        blit(splatMat, dyeRT.write);
        dyeRT.swap();
      };

  let lastX = -1,
    lastY = -1,
    lastMoveTime = 0;
  const onPointerMove = (e) => {
    if (!splat) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (lastX >= 0 && lastY >= 0) {
      const dx = (x - lastX) * 10;
      const dy = (y - lastY) * 10;
      splat({ x, y, dx, dy, color: new THREE.Vector3(0.5, 0.5, 0.5) });
      lastMoveTime = Date.now();
    }
    lastX = x;
    lastY = y;
  };
  const onPointerLeave = () => {
    lastX = -1;
    lastY = -1;
  };
  if (!config.disableFluid) {
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
  }

  let prevFrameTime = Date.now();
  let prevRenderTime = Date.now();
  const startTime = Date.now();
  const baseFPS = config.baseFPS || 60;
  const fluidStep = 1 / 60;
  let accumulator = 0;
  let rafId = null;

  const tick = () => {
    rafId = requestAnimationFrame(tick);
    if (video.readyState < 2 || video.paused) return;

    const now = Date.now();
    const dt = Math.min((now - prevFrameTime) / 1000, 0.1);
    prevFrameTime = now;
    accumulator += dt;

    // dynamic FPS: drop to 30 when video has finished + no recent mouse activity
    let targetFps = baseFPS;
    if (config.loopAt !== 0) {
      targetFps =
        video.currentTime < config.loopAt ||
        (!config.disableFluid && now - lastMoveTime < 2000)
          ? baseFPS
          : 30;
    }
    if (now - prevRenderTime < 1000 / targetFps) return;
    prevRenderTime = now;

    // run fluid steps until accumulator drains
    if (!config.disableFluid) {
      while (accumulator >= fluidStep) {
        // 1. curl
        curlMat.uniforms.uVelocity.value = velocityRT.read.texture;
        blit(curlMat, curlRT);

        // 2. vorticity confinement
        vorticityMat.uniforms.uVelocity.value = velocityRT.read.texture;
        vorticityMat.uniforms.uCurl.value = curlRT.texture;
        vorticityMat.uniforms.dt.value = fluidStep;
        blit(vorticityMat, velocityRT.write);
        velocityRT.swap();

        // 3. divergence
        divergenceMat.uniforms.uVelocity.value = velocityRT.read.texture;
        blit(divergenceMat, divergenceRT);

        // 4. clear pressure (with mild dissipation)
        clearMat.uniforms.uTexture.value = pressureRT.read.texture;
        clearMat.uniforms.value.value = 0;
        blit(clearMat, pressureRT.write);
        pressureRT.swap();

        // 5. pressure Jacobi iterations
        pressureMat.uniforms.uDivergence.value = divergenceRT.texture;
        for (let i = 0; i < config.fluidPressureIterations; i++) {
          pressureMat.uniforms.uPressure.value = pressureRT.read.texture;
          blit(pressureMat, pressureRT.write);
          pressureRT.swap();
        }

        // 6. gradient subtract
        gradientSubtractMat.uniforms.uPressure.value = pressureRT.read.texture;
        gradientSubtractMat.uniforms.uVelocity.value = velocityRT.read.texture;
        blit(gradientSubtractMat, velocityRT.write);
        velocityRT.swap();

        // 7. advect velocity
        advectMat.uniforms.uVelocity.value = velocityRT.read.texture;
        advectMat.uniforms.uSource.value = velocityRT.read.texture;
        advectMat.uniforms.dt.value = fluidStep;
        advectMat.uniforms.dissipation.value = config.fluidVelocityDissipation;
        blit(advectMat, velocityRT.write);
        velocityRT.swap();

        // 8. advect dye
        advectMat.uniforms.uVelocity.value = velocityRT.read.texture;
        advectMat.uniforms.uSource.value = dyeRT.read.texture;
        advectMat.uniforms.dissipation.value = config.fluidDyeDissipation;
        blit(advectMat, dyeRT.write);
        dyeRT.swap();

        accumulator -= fluidStep;
      }
    }

    // 9. display
    displayMaterial.uniforms.time.value = (now - startTime) * 0.001;
    if (!config.disableFluid && dyeRT) {
      displayMaterial.uniforms.uDye.value = dyeRT.read.texture;
    }
    displayMaterial.uniforms.uVideo.value = videoTexture;
    renderer.setRenderTarget(null);
    renderer.render(displayScene, displayCamera);
  };

  // visibility -> autoplay/pause
  const intersectionObs = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          prevFrameTime = Date.now();
          prevRenderTime = Date.now();
          accumulator = 0;
          lastMoveTime = 0;
          video.play().catch((e) => e);
        } else {
          video.pause();
        }
      }
    },
    { threshold: 0 },
  );
  intersectionObs.observe(container);

  // resize
  const resizeObs = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w === 0 || h === 0) return;
      displayCamera.left = -w / 2;
      displayCamera.right = w / 2;
      displayCamera.top = h / 2;
      displayCamera.bottom = -h / 2;
      displayCamera.updateProjectionMatrix();
      renderer.setSize(w, h);
      displayGeometry.dispose();
      displayGeometry = new THREE.PlaneGeometry(w, h);
      displayMesh.geometry = displayGeometry;
      if (!config.disableFluid && splatMat) {
        splatMat.uniforms.aspectRatio.value = w / h;
      }
      displayMaterial.uniforms.videoResolution.value.set(w, h);
    }
  });
  resizeObs.observe(container);

  // start
  Promise.resolve().then(() => {
    video.play().catch(() => {
      container.dispatchEvent(new Event("autoplayblocked"));
    });
    tick();
  });

  const cleanup = () => {
    intersectionObs.disconnect();
    resizeObs.disconnect();
    cancelAnimationFrame(rafId);
    if (!config.disableFluid) {
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      velocityRT?.read.dispose();
      velocityRT?.write.dispose();
      dyeRT?.read.dispose();
      dyeRT?.write.dispose();
      pressureRT?.read.dispose();
      pressureRT?.write.dispose();
      divergenceRT?.dispose();
      curlRT?.dispose();
      clearMat?.dispose();
      splatMat?.dispose();
      advectMat?.dispose();
      divergenceMat?.dispose();
      curlMat?.dispose();
      vorticityMat?.dispose();
      pressureMat?.dispose();
      gradientSubtractMat?.dispose();
      if (fluidMesh) {
        fluidMesh.material.dispose();
        fluidMesh.geometry.dispose();
      }
      fluidQuad?.dispose();
      fluidScene?.clear();
    }
    displayMaterial.dispose();
    displayGeometry.dispose();
    videoTexture.dispose();
    maskTexture.dispose();
    displayScene.clear();
    const lc = renderer.getContext().getExtension("WEBGL_lose_context");
    if (lc) lc.loseContext();
    renderer.dispose();
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.remove();
    const canvas = container.querySelector("canvas");
    if (canvas) container.removeChild(canvas);
  };

  return {
    video,
    renderer,
    displayMaterial,
    vorticityMaterial: vorticityMat,
    splatMaterial: splatMat,
    cleanup,
  };
}
