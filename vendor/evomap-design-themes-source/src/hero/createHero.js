// EvoMap hero engine — Stable Fluids + halftone display + procedural/video shape source.
//
// Lifecycle: createHero(container, config) builds the WebGL pipeline, returns
// { renderer, displayMaterial, logoMaterial, splatMaterial, cleanup }. Call
// cleanup() when tearing the hero down (variant swap, page unload).
//
// Pipeline overview:
//   1. shapeRT      ← logoFrag (procedural fallback) — only rendered when there
//                     is no Canvas2D mask AND no video source.
//   2. fluid steps  ← Stable Fluids on a half-resolution grid (skipped when
//                     config.disableFluid is true; e.g. newspaper/frost).
//   3. display pass ← displayFrag samples uShape (mask | video | shapeRT) +
//                     uDye, applies the radial vignette, lays out dots, and
//                     writes to the canvas.

import * as THREE from "https://esm.sh/three@0.169.0";
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
    logoFrag,
    displayFrag,
} from "../shaders/index.js";
import { defaultShaderConfig, GRID_LAYOUTS } from "./defaultConfig.js";
import { buildLogoMaskTexture } from "./logoMask.js";
import { createVideoSource, teardownVideoSource } from "./videoSource.js";

function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
        ? { r: parseInt(m[1], 16) / 255, g: parseInt(m[2], 16) / 255, b: parseInt(m[3], 16) / 255 }
        : { r: 1, g: 1, b: 1 };
}

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

function makeRT(width, height, type = THREE.HalfFloatType) {
    return new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type,
        depthBuffer: false,
        stencilBuffer: false,
    });
}

export { defaultShaderConfig };

export function createDottedVideo(container, userConfig = {}) {
    const config = { ...defaultShaderConfig, ...userConfig };

    const width = container.clientWidth;
    const height = container.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    container.appendChild(renderer.domElement);

    // ─── shape RT (procedural-logo fallback) ───
    let shapeRT = makeRT(width, height, THREE.UnsignedByteType);

    const offscreenScene = new THREE.Scene();
    const offscreenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fullQuad = new THREE.PlaneGeometry(2, 2);

    const logoMaterial = new THREE.ShaderMaterial({
        vertexShader: baseVert,
        fragmentShader: logoFrag,
        uniforms: {
            resolution: { value: new THREE.Vector2(width, height) },
            time: { value: 0 },
            ringInner: { value: config.ringInner },
            ringOuter: { value: config.ringOuter },
            ringSoftness: { value: config.ringSoftness },
            ringRotation: { value: 0 },
            ringFill: { value: config.ringFill },
            breath: { value: config.breath },
            nodeA: { value: new THREE.Vector3(config.nodes[0].angle, config.nodes[0].dist, config.nodes[0].radius) },
            nodeB: { value: new THREE.Vector3(config.nodes[1].angle, config.nodes[1].dist, config.nodes[1].radius) },
            nodeC: { value: new THREE.Vector3(config.nodes[2].angle, config.nodes[2].dist, config.nodes[2].radius) },
            nodePhases: { value: new THREE.Vector3(0.0, 2.1, 4.2) },
        },
    });
    const offscreenMesh = new THREE.Mesh(fullQuad, logoMaterial);
    offscreenScene.add(offscreenMesh);

    // ─── fluid simulation grid (half resolution) ───
    const simW = Math.floor(width / 2);
    const simH = Math.floor(height / 2);

    let fluidScene = null;
    let fluidCamera = null;
    let fluidQuad = null;
    let velocityRT = null;
    let dyeRT = null;
    let pressureRT = null;
    let divergenceRT = null;
    let curlRT = null;
    let texelSize = null;

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

    // ─── final display ───
    const cellSize = config.dotSize + config.dotMargin;
    const gridLayoutId = GRID_LAYOUTS[config.gridLayout] ?? 0;
    const dotRgb = hexToRgb(config.dotColor);

    const displayMaterial = new THREE.ShaderMaterial({
        vertexShader: baseVert,
        fragmentShader: displayFrag,
        uniforms: {
            uDye: { value: null },
            uShape: { value: shapeRT.texture },
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
            shapeRotation: { value: 0 },
            shapeBreath: { value: 0 },
            shapeScale: { value: config.shapeScale },
            falloffStrength: { value: config.falloffStrength },
            falloffRadius: { value: config.falloffRadius },
            falloffEnd: { value: config.falloffEnd },
        },
        transparent: true,
    });

    const displayScene = new THREE.Scene();
    const displayCamera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 1000);
    displayCamera.position.z = 1;
    let displayGeometry = new THREE.PlaneGeometry(width, height);
    const displayMesh = new THREE.Mesh(displayGeometry, displayMaterial);
    displayScene.add(displayMesh);

    // ─── shape source: video > Canvas2D mask > procedural fallback ───
    // Build the logo mask programmatically with Canvas2D when no video is set.
    // The display shader doesn't care whether uShape is canvas, video, or RT —
    // it just samples luminance per cell. This is how the original antimetal
    // hero works.
    let maskTexture = null;
    let videoEl = null;
    let videoTexture = null;

    if (config.videoSource) {
        const v = createVideoSource(THREE, container, config.videoSource);
        videoEl = v.videoEl;
        videoTexture = v.videoTexture;
        if (videoTexture) displayMaterial.uniforms.uShape.value = videoTexture;
    } else if (config.useShapeMask !== false) {
        try {
            maskTexture = buildLogoMaskTexture(THREE, config);
            displayMaterial.uniforms.uShape.value = maskTexture;
        } catch (err) {
            console.error("[evomap] buildLogoMaskTexture failed", err);
            maskTexture = null;
        }
    }

    // ─── helpers: blit one fluid pass into target RT ───
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

    // ─── animation loop ───
    let prevFrameTime = Date.now();
    let prevRenderTime = Date.now();
    const startTime = Date.now();
    const baseFPS = config.baseFPS || 60;
    const fluidStep = 1 / 60;
    let accumulator = 0;
    let rafId = null;
    let isVisible = true;

    const tick = () => {
        rafId = requestAnimationFrame(tick);
        if (!isVisible) return;

        const now = Date.now();
        const dt = Math.min((now - prevFrameTime) / 1000, 0.1);
        prevFrameTime = now;
        accumulator += dt;

        // throttle to baseFPS or 30 when idle
        const idle = config.disableFluid || now - lastMoveTime > 2000;
        const targetFps = idle ? Math.min(30, baseFPS) : baseFPS;
        if (now - prevRenderTime < 1000 / targetFps) return;
        prevRenderTime = now;

        const tSec = (now - startTime) * 0.001;

        // 1) draw the SDF logo into shapeRT — only used as the fallback when
        //    we have neither a Canvas2D mask nor a video source. The display
        //    shader samples whichever texture got assigned to uShape at init.
        const hasExternalShape = !!(maskTexture || videoTexture);
        if (!hasExternalShape) {
            logoMaterial.uniforms.time.value = tSec;
            logoMaterial.uniforms.ringRotation.value = tSec * config.ringRotationSpeed;
            renderer.setRenderTarget(shapeRT);
            renderer.render(offscreenScene, offscreenCamera);
        }

        // shape sampling animation: slow rotation + gentle breathing.
        // Applied to the mask texture's UVs in displayFrag.
        displayMaterial.uniforms.shapeRotation.value = tSec * config.ringRotationSpeed;
        displayMaterial.uniforms.shapeBreath.value = config.breath * Math.sin(tSec * 0.8);

        // 2) fluid steps
        if (!config.disableFluid) {
            while (accumulator >= fluidStep) {
                curlMat.uniforms.uVelocity.value = velocityRT.read.texture;
                blit(curlMat, curlRT);

                vorticityMat.uniforms.uVelocity.value = velocityRT.read.texture;
                vorticityMat.uniforms.uCurl.value = curlRT.texture;
                vorticityMat.uniforms.dt.value = fluidStep;
                blit(vorticityMat, velocityRT.write);
                velocityRT.swap();

                divergenceMat.uniforms.uVelocity.value = velocityRT.read.texture;
                blit(divergenceMat, divergenceRT);

                clearMat.uniforms.uTexture.value = pressureRT.read.texture;
                clearMat.uniforms.value.value = 0;
                blit(clearMat, pressureRT.write);
                pressureRT.swap();

                pressureMat.uniforms.uDivergence.value = divergenceRT.texture;
                for (let i = 0; i < config.fluidPressureIterations; i++) {
                    pressureMat.uniforms.uPressure.value = pressureRT.read.texture;
                    blit(pressureMat, pressureRT.write);
                    pressureRT.swap();
                }

                gradientSubtractMat.uniforms.uPressure.value = pressureRT.read.texture;
                gradientSubtractMat.uniforms.uVelocity.value = velocityRT.read.texture;
                blit(gradientSubtractMat, velocityRT.write);
                velocityRT.swap();

                advectMat.uniforms.uVelocity.value = velocityRT.read.texture;
                advectMat.uniforms.uSource.value = velocityRT.read.texture;
                advectMat.uniforms.dt.value = fluidStep;
                advectMat.uniforms.dissipation.value = config.fluidVelocityDissipation;
                blit(advectMat, velocityRT.write);
                velocityRT.swap();

                advectMat.uniforms.uVelocity.value = velocityRT.read.texture;
                advectMat.uniforms.uSource.value = dyeRT.read.texture;
                advectMat.uniforms.dissipation.value = config.fluidDyeDissipation;
                blit(advectMat, dyeRT.write);
                dyeRT.swap();

                accumulator -= fluidStep;
            }
        }

        // 3) display
        displayMaterial.uniforms.time.value = tSec;
        if (!config.disableFluid && dyeRT) {
            displayMaterial.uniforms.uDye.value = dyeRT.read.texture;
        }
        // Only fall back to the SDF shapeRT if we have NO external source.
        // Otherwise keep uShape pointing at the canvas mask or video texture
        // we wired up at init.
        if (!maskTexture && !videoTexture) {
            displayMaterial.uniforms.uShape.value = shapeRT.texture;
        }
        renderer.setRenderTarget(null);
        renderer.render(displayScene, displayCamera);
    };

    // ─── observers: pause when off-screen, resize with the container ───
    const intersectionObs = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                isVisible = entry.isIntersecting;
                if (isVisible) {
                    prevFrameTime = Date.now();
                    prevRenderTime = Date.now();
                    accumulator = 0;
                }
            }
        },
        { threshold: 0 },
    );
    intersectionObs.observe(container);

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
            // resize shape RT too
            shapeRT.dispose();
            shapeRT = makeRT(w, h, THREE.UnsignedByteType);
            if (!maskTexture && !videoTexture) {
                displayMaterial.uniforms.uShape.value = shapeRT.texture;
            }
            logoMaterial.uniforms.resolution.value.set(w, h);
        }
    });
    resizeObs.observe(container);

    Promise.resolve().then(() => {
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
        shapeRT.dispose();
        logoMaterial.dispose();
        offscreenMesh.geometry.dispose();
        maskTexture?.dispose();
        videoTexture?.dispose();
        teardownVideoSource(videoEl);
        offscreenScene.clear();
        displayMaterial.dispose();
        displayGeometry.dispose();
        displayScene.clear();
        const lc = renderer.getContext().getExtension("WEBGL_lose_context");
        if (lc) lc.loseContext();
        renderer.dispose();
        const canvas = container.querySelector("canvas");
        if (canvas) container.removeChild(canvas);
    };

    return { renderer, displayMaterial, logoMaterial, splatMaterial: splatMat, cleanup };
}





