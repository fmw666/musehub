// Shaders extracted 1:1 from antimetal.com production bundle (3e4461e2f85cbe38.js)
// Naming preserved: ae=baseVert, at=fluidVert, ai=clear, an=splat, ar=advect,
// aa=divergence, as=curl, ao=vorticity, al=pressure, ac=gradientSubtract, au=display

export const baseVert = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fluidVert = /* glsl */ `
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;

  void main() {
    vUv = uv;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const clearFrag = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float value;
  varying vec2 vUv;

  void main() {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

export const splatFrag = /* glsl */ `
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - point;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

export const advectFrag = /* glsl */ `
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  varying vec2 vUv;

  vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main() {
    vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    gl_FragColor = dissipation * bilerp(uSource, coord, texelSize);
  }
`;

export const divergenceFrag = /* glsl */ `
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main() {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;

    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }

    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

export const curlFrag = /* glsl */ `
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main() {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

export const vorticityFrag = /* glsl */ `
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main() {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

export const pressureFrag = /* glsl */ `
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

export const gradientSubtractFrag = /* glsl */ `
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;

  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

export const displayFrag = /* glsl */ `
  uniform sampler2D uDye;
  uniform sampler2D uVideo;
  uniform sampler2D uMask;
  uniform bool enableMask;
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
    float aspectRatio = videoResolution.x / videoResolution.y;

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
      // Alternating grid (brick pattern)
      cellIndex = floor(vUv * videoResolution / gridCellSize);
      float rowOffset = mod(cellIndex.y, 2.0) * gridCellSize * 0.5;
      vec2 offsetPixel = vUv * videoResolution + vec2(rowOffset, 0.0);
      cellIndex = floor(offsetPixel / gridCellSize);
      centerUv = ((cellIndex + 0.5) * gridCellSize - vec2(rowOffset, 0.0)) / videoResolution;
      gridPos = mod(offsetPixel, gridCellSize);
      cellCenter = vec2(gridCellSize * 0.5);
      distanceFromCenter = length(gridPos - cellCenter);

    } else {
      // Straight layout (default)
      gridPos = mod(vUv * videoResolution, gridCellSize);
      cellCenter = vec2(gridCellSize * 0.5);
      cellIndex = floor(vUv * videoResolution / gridCellSize);
      centerUv = ((cellIndex + 0.5) * gridCellSize) / videoResolution;
      distanceFromCenter = length(gridPos - cellCenter);
    }

    vec4 video = texture2D(uVideo, centerUv);
    vec4 dye = texture2D(uDye, centerUv);

    vec3 videoGammaCorrected = pow(video.rgb, vec3(gamma));
    vec3 scaledDye = dye.rgb * fluidStrength;
    scaledDye = pow(scaledDye + 0.001, vec3(0.7));
    vec3 blendedColor = videoGammaCorrected + scaledDye;

    float luminance = dot(blendedColor, vec3(0.299, 0.587, 0.114));

    if (enableMask) {
      vec4 mask = texture2D(uMask, vUv);
      float maskAlpha = mask.a;
      luminance = luminance * maskAlpha;
    }

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
