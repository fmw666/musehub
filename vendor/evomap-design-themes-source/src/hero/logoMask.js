// Builds the EvoMap emblem as a 1024×1024 grayscale Canvas2D bitmap and wraps
// it as a Three.js CanvasTexture. The downstream halftone shader treats white
// as "logo present" — anything you draw white shows up as dots; anything left
// black is empty space.
//
// 1:1 port of the bezier-logo reference (../design_raw/logo-canvas.html).
//
//   Reference design space is 666×666 with:
//     • drawLongRibbon : a tall asymmetric ribbon glyph
//     • drawShortMark  : a small detached curved wedge
//   The full emblem is two copies of (long + short), the second rotated
//   180° and translated by (28, -94) in the 666-grid → 4 independent
//   shapes around an implicit central void.
//
// The ribbon's top tip sits at y=15 in the 666 design grid — only 15px of
// padding from the canvas edge. When the hero's halftone shader samples
// this mask, anything that pushes outside the [0,1] UV range (after
// aspect-correction) gets clamped or cropped, so we'd lose the top tip.
// To keep the logo safely inside the visible region we INSET the whole
// 666-grid into a centred square that occupies `INSET` of the 1024 mask.

export function buildLogoMaskTexture(THREE, config) {
    const SIZE = 1024;
    const cv = document.createElement("canvas");
    cv.width = cv.height = SIZE;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);

    const REF = 666;
    const INSET = 0.78;                 // logo occupies 78% of mask, 11% padding each side
    const s = (SIZE * INSET) / REF;     // px / refUnit
    const PAD = (SIZE - SIZE * INSET) / 2;
    const x = (v) => PAD + v * s;
    const y = (v) => PAD + v * s;

    function drawLongRibbon(p) {
        p.moveTo(x(407), y(15));
        p.lineTo(x(457), y(64));
        p.bezierCurveTo(x(427), y(95), x(427), y(130), x(445), y(166));
        p.bezierCurveTo(x(458), y(192), x(482), y(219), x(494), y(256));
        p.bezierCurveTo(x(518), y(329), x(467), y(415), x(344), y(440));
        p.bezierCurveTo(x(338), y(418), x(330), y(396), x(320), y(373));
        p.bezierCurveTo(x(368), y(383), x(416), y(361), x(431), y(319));
        p.bezierCurveTo(x(447), y(273), x(421), y(233), x(399), y(198));
        p.bezierCurveTo(x(377), y(161), x(358), y(123), x(367), y(76));
        p.bezierCurveTo(x(372), y(51), x(386), y(29), x(407), y(15));
        p.closePath();
    }

    function drawShortMark(p) {
        p.moveTo(x(501), y(216));
        p.bezierCurveTo(x(538), y(226), x(570), y(217), x(593), y(197));
        p.lineTo(x(641), y(245));
        p.bezierCurveTo(x(609), y(274), x(571), y(291), x(526), y(290));
        p.bezierCurveTo(x(523), y(266), x(514), y(240), x(501), y(216));
        p.closePath();
    }

    function drawHalf(rotation, offsetX, offsetY) {
        ctx.save();
        // offsetX/offsetY are in the REF (666) grid → scale by s to mask px.
        ctx.translate(offsetX * s, offsetY * s);
        ctx.translate(SIZE / 2, SIZE / 2);
        ctx.rotate(rotation);
        ctx.translate(-SIZE / 2, -SIZE / 2);
        ctx.fillStyle = "#fff";
        const ribbon = new Path2D();
        drawLongRibbon(ribbon);
        ctx.fill(ribbon);
        const mark = new Path2D();
        drawShortMark(mark);
        ctx.fill(mark);
        ctx.restore();
    }

    drawHalf(0, 0, 0);
    drawHalf(Math.PI, 28, -94);

    // Soft-edge the whole bitmap. We keep the feather small (a few pixels) so
    // the logo silhouette stays crisp; the visible "halftone fade" instead
    // comes from the displayFrag side — it interprets the small grey gradient
    // band as luminance-driven dot shrinking + sparser cutoff. A larger blur
    // here would smear the entire logo into a uniform grey blob.
    const featherPx = config.maskFeather ?? 6;
    softBlur(ctx, SIZE, featherPx);

    // Optional debug overlay: ?peek=1 in the URL pins the raw mask bitmap to
    // the top-left so you can verify the Canvas2D draw before it's halftoned.
    if (typeof window !== "undefined") {
        window.__lastLogoMaskCanvas = cv;
        if (location.search.includes("peek=1")) {
            const tryAttach = () => {
                if (!document.body) {
                    setTimeout(tryAttach, 50);
                    return;
                }
                const old = document.getElementById("__evomap_peek");
                if (old) old.remove();
                const img = document.createElement("img");
                img.id = "__evomap_peek";
                img.src = cv.toDataURL();
                img.style.cssText = "position:fixed;left:8px;top:8px;width:316px;height:316px;border:2px solid #f0f;background:#000;z-index:99999;";
                document.body.appendChild(img);
            };
            tryAttach();
        }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.LinearSRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
}

// Soft-edge the mask. Naive `ctx.filter='blur'; drawImage(self,0,0)` does NOT
// produce a clean blur — it composites a blurred copy ON TOP of the original
// every pass, smearing brightness instead of just softening edges. The
// correct way is to render through a temporary canvas: clear, set filter,
// drawImage(source) → that canvas now holds a true blurred copy. Then we
// blit it back over the (cleared, re-blacked) original.
function softBlur(ctx, size, radius) {
    if (radius <= 0) return;
    const tmp = document.createElement("canvas");
    tmp.width = tmp.height = size;
    const tctx = tmp.getContext("2d");
    tctx.filter = `blur(${radius}px)`;
    tctx.drawImage(ctx.canvas, 0, 0);
    tctx.filter = "none";
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(tmp, 0, 0);
}
