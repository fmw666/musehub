// Wires up an HTMLVideoElement → THREE.VideoTexture so the halftone shader
// can sample video frames as its luminance source (the antimetal-style
// "video → dot field" path).
//
// Returns { videoEl, videoTexture } so the caller can dispose them on
// teardown. If anything in the setup throws (autoplay refusal, missing
// codec, missing Media Session API, etc.), we log and return nulls — the
// caller falls back to its mask path.

export function createVideoSource(THREE, container, src) {
    let videoEl = null;
    let videoTexture = null;
    try {
        videoEl = document.createElement("video");
        videoEl.src = src;
        videoEl.crossOrigin = "anonymous";
        videoEl.muted = true;
        videoEl.loop = true;
        videoEl.playsInline = true;
        videoEl.autoplay = true;
        videoEl.setAttribute("muted", "");
        videoEl.setAttribute("playsinline", "");
        videoEl.style.display = "none";
        container.appendChild(videoEl);
        const playPromise = videoEl.play();
        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch((err) =>
                console.warn("[evomap] video autoplay blocked", err),
            );
        }
        videoTexture = new THREE.VideoTexture(videoEl);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.wrapS = videoTexture.wrapT = THREE.ClampToEdgeWrapping;
        videoTexture.generateMipmaps = false;
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        return { videoEl, videoTexture };
    } catch (err) {
        console.error("[evomap] video source setup failed", err);
        if (videoEl?.parentNode) videoEl.parentNode.removeChild(videoEl);
        return { videoEl: null, videoTexture: null };
    }
}

// Stop the video, drop its src, and detach from DOM. Safe to call when
// videoEl is null (no video source was used).
export function teardownVideoSource(videoEl) {
    if (!videoEl) return;
    try {
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();
    } catch (e) { /* ignore — best-effort teardown */ }
    if (videoEl.parentNode) videoEl.parentNode.removeChild(videoEl);
}
