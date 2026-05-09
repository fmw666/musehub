// Aggregator for every GLSL string in the project.
// Consumers should import from here, never from the leaf files directly —
// that way the leaf split can be reorganized again later without ripple.

export { baseVert, fluidVert } from "./common.js";
export {
    clearFrag,
    splatFrag,
    advectFrag,
    divergenceFrag,
    curlFrag,
    vorticityFrag,
    pressureFrag,
    gradientSubtractFrag,
} from "./fluid.js";
export { logoFrag } from "./logo.js";
export { displayFrag } from "./display.js";
