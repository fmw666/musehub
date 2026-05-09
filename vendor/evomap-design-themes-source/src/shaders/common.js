// Vertex shaders shared by every fragment program in the pipeline.
//
//   baseVert  — pass-through vUv. Used by the splat / clear / display materials
//               and by the offscreen logo material (no neighbour samples needed).
//   fluidVert — also computes vL/vR/vT/vB (the four texel-offset uvs) so that
//               divergence/curl/vorticity/pressure/gradientSubtract can read
//               4-neighbour samples without burning a multiply-add per pixel.

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
