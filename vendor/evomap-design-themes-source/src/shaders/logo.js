// Procedural EvoMap emblem fallback (used only when the Canvas2D mask hasn't
// landed yet, or when a caller passes useShapeMask:false). The "real" logo is
// drawn by hero/logoMask.js as a 1024² bitmap; this shader exists so the
// pipeline never has to render with an empty uShape texture.
//
// Construction (all SDFs in normalized space, 1 unit = min(width,height)):
//   • Two main bands: each is an off-centre ring arc (centre offset along the
//     45° axis) so the two arcs interlock, leaving a clean circular hole in
//     the middle. Each arc is sliced at its leading end by an oblique plane
//     to produce the sharp hook tip.
//   • Two side wedges: small ring arcs to the left and right, oriented so
//     their flow matches the main bands.
// All shapes are unioned with smooth-min so dot density stays consistent at
// joins; the "softness" uniform controls the edge half-width.
//
// Compatibility note: the public uniform list (ringInner/ringOuter/nodeA…) is
// preserved for the host code. Inside this shader we only consume:
//   ringOuter   -> overall scale of the emblem
//   ringInner   -> radius of the central void (clean circle in the middle)
//   ringSoftness-> edge softness for halftone falloff
//   ringRotation, breath -> animation
//   nodeA.z     -> band thickness (reused as a free dial)
//   nodeB.z     -> side-wedge size
//   nodeC.x     -> tip cut angle (radians) for sharp end terminals

export const logoFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform vec2 resolution;
  uniform float time;
  uniform float ringInner;     // central void radius (carved out of the bands)
  uniform float ringOuter;     // overall scale (S amplitude / vertical reach)
  uniform float ringSoftness;  // soft edge half-width
  uniform float ringRotation;
  uniform float breath;
  uniform float ringFill;

  // Re-used as free dials for the emblem:
  //   nodeA.z = band thickness (half-width)
  //   nodeB.z = side-wedge size scale (0 = off)
  //   nodeC.x = tip cut angle (radians) for sharp angular terminals
  uniform vec3 nodeA;
  uniform vec3 nodeB;
  uniform vec3 nodeC;
  uniform vec3 nodePhases;

  const float PI = 3.14159265359;

  // Distance to a circular arc segment.
  //   C = arc centre, r = arc radius, [a0, a1] = angular range (a0 < a1).
  // If p's angle (relative to C) is within range, distance is |dist - r|.
  // Otherwise we return distance to the nearest of the two endpoints.
  // This is an unsigned distance to the curve (not a band yet).
  float arcCurveDist(vec2 p, vec2 C, float r, float a0, float a1) {
    vec2 d = p - C;
    float ang = atan(d.y, d.x);
    float ac = 0.5 * (a0 + a1);
    float aw = 0.5 * (a1 - a0);
    float wrapped = atan(sin(ang - ac), cos(ang - ac));
    if (abs(wrapped) <= aw) {
      return abs(length(d) - r);
    }
    // Outside angular range: distance to the closer endpoint.
    float side = sign(wrapped);
    vec2 endPt = C + r * vec2(cos(ac + side * aw), sin(ac + side * aw));
    return length(p - endPt);
  }

  // Distance to one yin-yang-style S-curve consisting of two tangent
  // half-circle arcs that, together, form a smooth "S" running from
  // (-R, 0) through (0, 0) to (+R, 0). The two sub-arcs are:
  //   left arc:  centre (-R/2, 0), radius R/2, lower half (angle 180→360)
  //   right arc: centre (+R/2, 0), radius R/2, upper half (angle 0→180)
  // Together these glue at (0, 0) tangentially.
  float yinYangSDist(vec2 p, float R) {
    float r = 0.5 * R;
    // left arc: lower half (angle range [-PI, 0])
    float dL = arcCurveDist(p, vec2(-r, 0.0), r, -PI, 0.0);
    // right arc: upper half (angle range [0, PI])
    float dR = arcCurveDist(p, vec2(+r, 0.0), r, 0.0, PI);
    return min(dL, dR);
  }

  // Smooth min for nice halftone joins.
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  void main() {
    vec2 px = vUv * resolution;
    vec2 center = resolution * 0.5;
    float minDim = min(resolution.x, resolution.y);
    vec2 p = (px - center) / minDim;

    // global slow rotation
    float cs = cos(ringRotation), sn = sin(ringRotation);
    p = mat2(cs, -sn, sn, cs) * p;

    // breathing pulse on the whole emblem
    float pulse = 1.0 + breath * sin(time * 0.8) * 0.03;
    p /= pulse;

    // parameters
    float R    = ringOuter;          // outer reach of the emblem (= R in the math)
    float hole = ringInner;          // central void radius (carves a clean middle)
    float th   = nodeA.z;            // band half-thickness
    float wedgeScale = nodeB.z;      // 0 disables side wedges
    float tipCut = nodeC.x;          // tip cut angle (radians)

    // Two yin-yang-style S-curves: one horizontal (running left↔right) and a
    // second one rotated by 90° (running top↔bottom). Together they wrap the
    // central void exactly the way the reference logo does: two thick bands
    // interlocking with a clean circular hole in the middle and four tips
    // pointing diagonally outwards.
    //
    // Each band is the unsigned distance to the curve, minus the half
    // thickness th. Negative ⇒ inside the band; positive ⇒ outside.
    float dH = yinYangSDist(p, R) - th;
    vec2 pV = vec2(-p.y, p.x);                        // 90° rotation of p
    float dV = yinYangSDist(pV, R) - th;
    float main_d = smin(dH, dV, 0.012);

    // Sharp angled terminal cuts at the four endpoints (±R, 0) and (0, ±R).
    // The S-curve tangent at each endpoint runs along ±y (for the horizontal
    // S) or ±x (for the vertical S), so the natural cut planes have normals
    // along ±x or ±y. We tilt them by tipCut for the angled-tip look.
    if (tipCut > 0.001) {
      float ct = cos(tipCut), st = sin(tipCut);
      // horizontal S: tip at (+R, 0). Tangent ≈ +y at this end → cut normal ≈ +x.
      vec2 nR = vec2(ct, +st);
      main_d = max(main_d, dot(p - vec2(+R, 0.0), nR));
      // tip at (-R, 0): cut normal ≈ -x
      vec2 nL = vec2(-ct, -st);
      main_d = max(main_d, dot(p - vec2(-R, 0.0), nL));
      // vertical S: tip at (0, +R)
      vec2 nT = vec2(-st, ct);
      main_d = max(main_d, dot(p - vec2(0.0, +R), nT));
      // tip at (0, -R)
      vec2 nB = vec2(+st, -ct);
      main_d = max(main_d, dot(p - vec2(0.0, -R), nB));
    }

    // Carve a clean circular void at the centre.
    if (hole > 0.001) {
      float voidD = length(p) - hole;
      main_d = max(main_d, -voidD);
    }

    // Side wedges: two small detached S-curve slivers further out along ±x,
    // visually echoing the main flow. They sit just outside the main lobes'
    // horizontal tips at (±R, 0).
    float wedge_d = 1e9;
    if (wedgeScale > 0.001) {
      float wR = R * 0.32;
      float wTh = th * 0.55;
      float wOff = R * 1.18;
      vec2 prr = p - vec2(+wOff, 0.0);
      vec2 plr = p - vec2(-wOff, 0.0);
      float dr = yinYangSDist(prr, wR) - wTh;
      float dl = yinYangSDist(plr, wR) - wTh;
      wedge_d = min(dr, dl);
    }

    // Wedges as a separate (un-smoothed) union so they stay visually detached.
    float d = (wedgeScale > 0.001) ? min(main_d, wedge_d) : main_d;

    // Convert to soft luminance mask.
    float shape = 1.0 - smoothstep(-ringSoftness, ringSoftness, d);

    // Optional inner-fill mode (variant 10 — fills the central hole too).
    if (ringFill > 0.5) {
      float diskFill = 1.0 - smoothstep(R * 0.5 - ringSoftness, R * 0.5 + ringSoftness, length(p));
      shape = max(shape, diskFill);
    }

    gl_FragColor = vec4(vec3(shape), 1.0);
  }
`;
