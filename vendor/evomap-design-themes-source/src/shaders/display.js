// Halftone display fragment.
//
// This is the final pass that ends up on screen. It samples three sources:
//   uShape    — the logo mask (Canvas2D bitmap or VideoTexture). Drives where
//               dots appear and how big they are.
//   uDye      — the fluid simulation's dye buffer. Brightens cells the cursor
//               has touched, without shifting hue (we add it to luminance).
//   per-cell  — pseudo-random phase for the gentle pulsing animation.
//
// The grid layout has three modes (uniform `gridLayout`):
//   0 = straight square grid
//   1 = polar grid (concentric rings of equal-area cells)
//   2 = brick / alternating-row grid
//
// The radial vignette uniforms (falloffStrength/Radius/End) are applied to
// luminance BEFORE the dot-size calculation. That's important: if we only
// multiplied finalAlpha by the vignette, edges would still draw same-size
// solid dots, just with lower opacity — visually a hard "ring" of dim dots.
// Multiplying luminance instead makes the halftone fade naturally: edge dots
// shrink, get sparser, AND dim, all in lockstep.

export const displayFrag = /* glsl */ `
  uniform sampler2D uDye;
  uniform sampler2D uShape;
  uniform float fluidStrength;
  uniform float gridCellSize;
  uniform float dotRadius;
  uniform float minDotRadius;
  uniform vec2 videoResolution;
  uniform float time;
  uniform float animSpeed;
  uniform float gamma;
  uniform int gridLayout; // 0=straight, 1=radial, 2=alternating-grid
  uniform vec3 dotColor;
  uniform float dotAlphaMultiplier;
  uniform bool dotsEnabled;
  // shape sampling controls (used to add subtle breath/rotation to a static logo mask)
  uniform float shapeRotation;   // radians, applied as in-uv rotation around (0.5, 0.5)
  uniform float shapeBreath;     // -1..+1, scales the uv offset (negative = expand)
  uniform float shapeScale;      // 1.0 = mask fills its protected square exactly. >1.0 shrinks the visible logo (samples further out into the mask's empty padding).
  // Radial vignette controls. With falloffStrength = 0 the whole effect is
  // a no-op (vignette resolves to 1.0 everywhere). Defaults applied via
  // hero/defaultConfig.js give every variant a gentle edge fade so the
  // central logo region dominates and mouse smears visibly weaken at corners.
  uniform float falloffStrength;  // 0..1 — how much edges fade (0 = off)
  uniform float falloffRadius;    // 0..0.7 — protected centre core (no fade inside)
  uniform float falloffEnd;       // 0..1.4 — distance where fade reaches max (corner ≈ 0.707)
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    vec2 gridPos;
    vec2 cellCenter;
    vec2 cellIndex;
    vec2 centerUv;
    float distanceFromCenter;

    if (gridLayout == 1) {
      // Radial layout
      vec2 pixelPos = vUv * videoResolution;
      vec2 center = videoResolution * 0.5;
      float minDim = min(videoResolution.x, videoResolution.y);
      vec2 normalizedPos = (pixelPos - center) / minDim;

      float angle = atan(normalizedPos.y, normalizedPos.x);
      float radius = length(normalizedPos) * minDim;

      float ringIndex = floor(radius / gridCellSize);
      vec2 dotCenterNormalized;
      float dotIndex;

      if (ringIndex < 0.5) {
        dotCenterNormalized = vec2(0.0, 0.0);
        dotIndex = 0.0;
      } else {
        float ringRadius = ringIndex * gridCellSize;
        float circumference = 6.28318 * ringRadius;
        float numDotsInRing = max(1.0, floor(circumference / gridCellSize));
        float anglePerDot = 6.28318 / numDotsInRing;
        dotIndex = floor(angle / anglePerDot);

        float dotAngle = (dotIndex + 0.5) * anglePerDot;
        float dotR = (ringIndex + 0.5) * gridCellSize;
        dotCenterNormalized = vec2(cos(dotAngle), sin(dotAngle)) * (dotR / minDim);
      }

      vec2 dotCenterPixel = dotCenterNormalized * minDim + center;
      vec2 toDotNormalized = normalizedPos - dotCenterNormalized;
      distanceFromCenter = length(toDotNormalized) * minDim;
      centerUv = dotCenterPixel / videoResolution;
      cellIndex = vec2(ringIndex, dotIndex);
      gridPos = vec2(0.0);
      cellCenter = vec2(0.0);

    } else if (gridLayout == 2) {
      cellIndex = floor(vUv * videoResolution / gridCellSize);
      float rowOffset = mod(cellIndex.y, 2.0) * gridCellSize * 0.5;
      vec2 offsetPixel = vUv * videoResolution + vec2(rowOffset, 0.0);
      cellIndex = floor(offsetPixel / gridCellSize);
      centerUv = ((cellIndex + 0.5) * gridCellSize - vec2(rowOffset, 0.0)) / videoResolution;
      gridPos = mod(offsetPixel, gridCellSize);
      cellCenter = vec2(gridCellSize * 0.5);
      distanceFromCenter = length(gridPos - cellCenter);

    } else {
      gridPos = mod(vUv * videoResolution, gridCellSize);
      cellCenter = vec2(gridCellSize * 0.5);
      cellIndex = floor(vUv * videoResolution / gridCellSize);
      centerUv = ((cellIndex + 0.5) * gridCellSize) / videoResolution;
      distanceFromCenter = length(gridPos - cellCenter);
    }

    // Sample the logo mask. The mask is a 1024² SQUARE bitmap so we
    // aspect-correct shapeUv: scale x by width/minDim so the logo stays
    // square-shaped regardless of viewport ratio (instead of smearing
    // horizontally across the whole hero). The mask itself bakes in
    // ~11% padding (INSET=0.78 in buildLogoMaskTexture).
    vec2 shapeUv = centerUv - vec2(0.5);
    float minDim = min(videoResolution.x, videoResolution.y);
    shapeUv.x *= videoResolution.x / minDim;
    shapeUv.y *= videoResolution.y / minDim;
    float scs = cos(shapeRotation), sns = sin(shapeRotation);
    shapeUv = mat2(scs, -sns, sns, scs) * shapeUv;
    shapeUv *= (1.0 - shapeBreath * 0.04); // breath is in [-1,1]
    shapeUv *= shapeScale;                  // >1 = logo appears smaller
    shapeUv += vec2(0.5);
    vec4 shape = texture2D(uShape, shapeUv);
    vec4 dye = texture2D(uDye, centerUv);

    vec3 shapeGammaCorrected = pow(shape.rgb, vec3(gamma));
    vec3 scaledDye = dye.rgb * fluidStrength;
    scaledDye = pow(scaledDye + 0.001, vec3(0.7));
    vec3 blendedColor = shapeGammaCorrected + scaledDye;

    float luminance = dot(blendedColor, vec3(0.299, 0.587, 0.114));

    // Radial vignette factor. Centre of the canvas (vUv = 0.5,0.5) maps to
    // distance 0; the corners map to ~0.707 (after aspect-correction below
    // they map to slightly more on widescreen). falloffRadius defines a
    // protected core where the multiplier stays at 1.0, then we smoothstep
    // down to (1.0 - falloffStrength) by falloffEnd. With falloffStrength
    // = 0 the mix collapses back to 1.0 everywhere — no-op.
    vec2 falloffUv = vUv - vec2(0.5);
    falloffUv.x *= videoResolution.x / min(videoResolution.x, videoResolution.y);
    falloffUv.y *= videoResolution.y / min(videoResolution.x, videoResolution.y);
    float distFromMid = length(falloffUv);
    float vignette = 1.0 - smoothstep(falloffRadius, falloffEnd, distFromMid) * falloffStrength;

    // Apply vignette to luminance BEFORE dot sizing — this is what makes the
    // halftone fade-out look natural: edge dots get progressively smaller AND
    // sparser AND dimmer in lockstep, instead of just getting more transparent
    // (which would show as a hard ring of small but solid dots).
    luminance *= vignette;

    if (!dotsEnabled) {
      gl_FragColor = vec4(dotColor, luminance * dotAlphaMultiplier);
      return;
    }

    float randomValue = random(cellIndex);
    float phase = randomValue * 6.28318;
    float scaleAnimation = sin(time * animSpeed + phase) * 0.5 + 0.5;
    float randomScale = 1.0 - (scaleAnimation * 0.5);

    float luminanceMinScale = min(minDotRadius / dotRadius, 1.0);
    float finalScale = (luminanceMinScale + (luminance * (1.0 - luminanceMinScale))) * randomScale;
    float scaledRadius = dotRadius * finalScale;

    float maxRadius = gridCellSize * 0.5;
    scaledRadius = min(scaledRadius, maxRadius);

    float edgeWidth = 0.5;
    float dotMask = 1.0 - smoothstep(scaledRadius - edgeWidth, scaledRadius + edgeWidth, distanceFromCenter);

    float luminanceCutoff = smoothstep(0.0, 0.1, luminance);
    float finalAlpha = dotMask * luminance * luminanceCutoff * dotAlphaMultiplier;

    gl_FragColor = vec4(dotColor, finalAlpha);
  }
`;
