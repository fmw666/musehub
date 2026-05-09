// Default hero configuration.
//
// Anything here can be overridden per variant via variants/themes/*.js. The
// hero engine spreads userConfig over these defaults, so missing fields just
// fall through to the values below.
//
// Geometry units: normalized so 1 = min(canvas.width, canvas.height).

export const defaultShaderConfig = {
    // dot rendering
    dotsEnabled: true,
    dotSize: 8,
    minDotSize: 1,
    dotMargin: 0,
    dotColor: "#e0f6ff",
    dotAlphaMultiplier: 1,
    gridLayout: "straight", // "straight" | "radial" | "alternating-grid"
    animSpeed: 4,
    gamma: 0.9,
    backgroundColor: "#000000",

    // Logo geometry — drives the procedural fallback shape (logoFrag) when
    // no Canvas2D mask or video source is configured.
    //   ringOuter   = S amplitude (half-height of one stroke; overall scale)
    //   ringInner   = central void radius (carved out where the strokes cross)
    //   nodes[0].z  = band thickness (half-width)
    //   nodes[1].z  = side-wedge size scale (0 = disable)
    //   nodes[2].x  = tip cut angle (radians)
    ringInner: 0.16,
    ringOuter: 0.62,
    ringSoftness: 0.012,
    ringRotationSpeed: 0.0,
    ringFill: 0,
    breath: 1.0,
    nodes: [
        { angle: 0.0, dist: 0.0, radius: 0.085 },        // band half-thickness
        { angle: 0.0, dist: 0.0, radius: 1.0 },          // wedges on
        { angle: Math.PI / 6, dist: 0.0, radius: 0.0 },  // ~30° tip cut
    ],

    // fluid
    disableFluid: false,
    fluidCurl: 100,
    fluidVelocityDissipation: 0.93,
    fluidDyeDissipation: 0.95,
    fluidSplatRadius: 0.006,
    fluidPressureIterations: 1,
    fluidStrength: 0.15,

    // Radial vignette — fades dots toward the corners so the eye stays on
    // the central logo area, and the mouse smear visibly weakens at the edges.
    // Tuned for full-viewport canvas: the protected core covers the logo,
    // outer regions still get a sparse halftone shimmer that fades all the
    // way to black at the corners.
    falloffStrength: 0.95,
    falloffRadius: 0.32,
    falloffEnd: 1.05,

    // Logo mask edge feather (px, on the 1024² mask bitmap). Larger values
    // produce a wider gradient band around the logo silhouette, which the
    // halftone grid samples as progressively-smaller-and-sparser dots.
    // Keep small (≤ ~10) — too much blur smears the silhouette into a grey
    // blob and the halftone fade has to come purely from the vignette.
    maskFeather: 6,

    // Visual scale of the logo inside the canvas. 1.0 = the mask's own
    // INSET (78%) determines how big the logo looks. Values > 1 shrink it
    // by sampling further out into the mask's padded empty area; useful when
    // the canvas is full-viewport and the logo would otherwise feel too big.
    shapeScale: 1.25,

    baseFPS: 60,
    disabledOnMobile: false,
};

// String → integer mapping for the gridLayout uniform in displayFrag.
export const GRID_LAYOUTS = { straight: 0, radial: 1, "alternating-grid": 2 };
