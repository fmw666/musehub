// Canvas2D engine — "cellular cluster field".
// Adapted from cellular-cluster-field/src/components/CellularCanvas.tsx,
// stripped of React/LayerConfig/recording/export/background-image/mask logic.
//
// Contract matches createDottedVideo: (container, config) => { cleanup() }.
// `container` should be a positioned element; we mount one <canvas> inside
// it with absolute fill. The hero swap logic in main.js is unchanged.

import { noise3D } from "./noise3D.js";

export const cellularDefaultConfig = {
    gridSpacing: 35,
    cellMaxRadius: 14,
    membraneStrokeWidth: 0.7,
    membraneOpacity: 0.7,
    nucleusSize: 2.5,
    connectionOpacity: 0.1,
    ghostTrail: 0.25,
    globalSpeed: 0.9,
    nucleusSpeed: 0.01,
    nucleusCountRatio: 0.14,
    // Initial seed: how many nuclei to spawn at boot, as a ratio of total
    // nodes. Much smaller than nucleusCountRatio so the field starts as a
    // tight blob and grows out via homeostasis + splits, rather than
    // filling the screen on frame 1.
    initialSeedRatio: 0.025,
    // Initial seed footprint: max radius from canvas centre, as a fraction
    // of min(width, height). 0.22 ≈ a fist-sized blob in the middle.
    initialSeedRadius: 0.22,
    activationGrow: 0.25,
    activationDecay: 0.01,
    clusterCohesion: 0.15,
    cohesionRatio: 0.65,
    wanderSparsity: 1.3,
    boidsWeight: 0.2,
    nucleusMaxPerCell: 4,
    nucleusSplitProb: 0.005,
    homeostasisRate: 0.02,
    randomSpawnProb: 0.05,
    membraneGrowSpeed: 0.15,
    membraneDecaySpeed: 0.05,
    bgColor: "#050505",
    membraneColor: "#ffffff",
    nucleusColor: "#ffffff",
    connectionColor: "#ffffff",
    // Soft radial vignette so the field fades toward the corners (matches
    // the halftone engine's signature look). 0 = off, 1 = strong.
    vignetteStrength: 0.35,
    // ── Spatial layout controls (used by the split-pane "right-biased"
    // cellular variant; defaults are 0 / false so the existing behaviour
    // for other themes is unchanged). ──
    //   initialUniform=true: seed nuclei evenly across the *entire* canvas
    //     (every Nth grid cell) instead of in a centre blob.
    //   rightBias ∈ [0,1]: how strongly nuclei migrate / persist toward the
    //     right half of the canvas in steady state. 0 = no bias.
    //   rightBiasRamp: seconds from boot to reach full rightBias. The seed
    //     is uniform; bias grows in over this window so the user sees the
    //     field redistribute organically rather than snapping.
    initialUniform: false,
    rightBias: 0,
    rightBiasRamp: 6.0,
    // Left-load ceiling for the right-biased layout. Expressed as a
    // fraction of `nucleusCountRatio` — e.g. 0.45 means the left half of
    // the canvas is allowed to host at most 45% × nucleusCountRatio nuclei
    // (per left-half node). Lets the field still *grow* on the left so
    // every region keeps signal, but caps how dense the left can get so
    // the text column underneath stays readable. Only consulted when
    // rightBias > 0.
    leftLoadFactor: 0.5,
};

function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
        ? `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`
        : "255, 255, 255";
}

export function createCellularHero(container, userConfig = {}) {
    const config = { ...cellularDefaultConfig, ...userConfig };

    // ── canvas mount ──
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.display = "block";
    canvas.style.touchAction = "none";
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
        return { cleanup() { canvas.remove(); } };
    }

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let nodes = [];
    let nuclei = [];
    let lastSpacing = 0;
    let time = 0;
    let raf = 0;
    let stopped = false;
    // Wall-clock time of the first frame, used to ramp the rightBias from 0
    // to its target value over `rightBiasRamp` seconds. Set lazily in step()
    // so resize() rebuilds don't reset the ramp mid-flight.
    let bootMs = 0;

    // Pointer state (drag to spawn nuclei).
    let isPointerDown = false;
    let lastAddedNodeId = -1;

    // ── grid (re)initialisation ──
    // Builds a regular lattice that overflows the canvas by one cell on
    // every side, computes 8-neighbour adjacency, and seeds nuclei
    // preferring the centre of the canvas.
    function initGrid() {
        nodes = [];
        nuclei = [];
        let id = 0;
        const sp = config.gridSpacing;
        const cols = Math.ceil(width / sp) + 2;
        const rows = Math.ceil(height / sp) + 2;

        for (let r = -1; r < rows; r++) {
            for (let c = -1; c < cols; c++) {
                nodes.push({
                    id: id++,
                    x: c * sp,
                    y: r * sp,
                    col: c,
                    row: r,
                    activation: 0,
                    membraneRadius: 0,
                    neighbors: [],
                });
            }
        }

        // 8-neighbour connectivity. nodes are ordered row-major so we can
        // index by (col,row) → idx, but n^2 is fine here (a few thousand).
        for (const node of nodes) {
            for (const other of nodes) {
                if (other === node) continue;
                const dx = Math.abs(other.col - node.col);
                const dy = Math.abs(other.row - node.row);
                if (dx <= 1 && dy <= 1) node.neighbors.push(other);
            }
        }

        // Seeding strategy:
        //   - `initialUniform=true`: drop seeds inside ≤5 small disc-shaped
        //     "patches" instead of evenly across the canvas. Patches are
        //     placed mostly on the left half (the field grows outward via
        //     homeostasis, so left-leaning origins make the diffusion
        //     visible — by the time it settles, the right-bias ramp has
        //     pulled the steady-state distribution rightward as configured).
        //     Each patch's seeds sit on random interior nodes whose
        //     distance to the patch centre is below the patch radius;
        //     density falls off smoothly from the centre, so the patches
        //     read as irregular blobs rather than discs. Number of seeds
        //     is still capped by `initialSeedRatio` (kept low so the open
        //     space between patches is the dominant visual).
        //   - default (centre blob): irregular amoeba near the middle that
        //     spreads outward via homeostasis. See comments below.
        const target = nodes.length * config.initialSeedRatio;

        if (config.initialUniform) {
            const seedCount = Math.max(1, target | 0);

            // Pick 3-5 patch centres. X-positions are biased toward the
            // left half (60% chance of x ∈ [0.05, 0.45] width, 40% chance
            // of x ∈ [0.45, 0.85] — a couple of right-side patches keeps
            // the screen from looking off-balance during boot). Y is
            // anywhere in [0.1, 0.9] height. We also enforce a minimum
            // pairwise distance so patches don't merge into a blob.
            const patchCount = 3 + ((Math.random() * 3) | 0); // 3..5
            const patches = [];
            const minSep = Math.min(width, height) * 0.18;
            let guard = 0;
            while (patches.length < patchCount && guard++ < 60) {
                const leftSide = Math.random() < 0.6;
                const px = leftSide
                    ? width * (0.05 + Math.random() * 0.4)
                    : width * (0.45 + Math.random() * 0.4);
                const py = height * (0.1 + Math.random() * 0.8);
                const tooClose = patches.some(
                    (q) => Math.hypot(px - q.x, py - q.y) < minSep,
                );
                if (tooClose) continue;
                // Patch radius is ~6-10% of the shorter screen dimension.
                // Small enough that the screen reads as "a few clusters
                // with empty space between" rather than a continuous fog.
                const radius =
                    Math.min(width, height) * (0.06 + Math.random() * 0.04);
                patches.push({ x: px, y: py, radius });
            }
            if (patches.length === 0) {
                // Fallback (extremely tight viewport): one centre patch.
                patches.push({
                    x: width * 0.4,
                    y: height * 0.5,
                    radius: Math.min(width, height) * 0.1,
                });
            }

            // Distribute seeds across patches. Each patch picks random
            // interior nodes inside its disc, with distance-weighted
            // acceptance so density tapers toward the edge.
            const interiorByPatch = patches.map((patch) => {
                const cands = [];
                for (const node of nodes) {
                    if (node.x < 0 || node.y < 0) continue;
                    if (node.x > width || node.y > height) continue;
                    const d = Math.hypot(node.x - patch.x, node.y - patch.y);
                    if (d <= patch.radius) cands.push({ node, d });
                }
                return cands;
            });

            // Assign seedCount across patches roughly equally. Tiny patches
            // (small interior list) get fewer to avoid duplicate node picks.
            const totalCands = interiorByPatch.reduce(
                (acc, list) => acc + list.length,
                0,
            );
            for (let i = 0; i < patches.length; i++) {
                const list = interiorByPatch[i];
                if (list.length === 0) continue;
                const share =
                    totalCands > 0
                        ? Math.round((seedCount * list.length) / totalCands)
                        : Math.floor(seedCount / patches.length);
                const used = new Set();
                let placed = 0;
                let attempts = 0;
                while (placed < share && attempts++ < share * 4) {
                    const pick = list[(Math.random() * list.length) | 0];
                    // Edge-falloff acceptance: closer to centre = more
                    // likely. Exponent 1.5 gives a soft-edged blob.
                    const t = pick.d / patches[i].radius; // 0..1
                    const accept = 1 - Math.pow(t, 1.5);
                    if (Math.random() > accept) continue;
                    if (used.has(pick.node.id)) continue;
                    used.add(pick.node.id);
                    nuclei.push({
                        currentNode: pick.node,
                        nextNode: pick.node,
                        progress: 0,
                    });
                    placed++;
                }
            }
            return;
        }

        // Default: irregular blob near the centre. Two ideas:
        //   - cap the seed count at `initialSeedRatio` (much smaller than the
        //     homeostasis target), so the field starts sparse and grows.
        //   - shape the seed region with low-frequency simplex noise so the
        //     edge isn't a clean circle — it reads as a living amoeba that's
        //     about to spread outward.
        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.min(width, height) * config.initialSeedRadius;
        // Noise frequency is tied to grid spacing so the blob's lobes are
        // visually similar at any zoom level (~3-4 lobes across the radius).
        const blobFreq = 1.8 / maxR;

        const candidates = [];
        for (const node of nodes) {
            const dx = node.x - cx;
            const dy = node.y - cy;
            const dist = Math.hypot(dx, dy);
            if (dist > maxR) continue;

            // Distance falloff (1 at centre → 0 at maxR), squared so the core
            // stays dense while the rim gets sparse.
            const falloff = 1 - dist / maxR;
            const radial = falloff * falloff;

            // Noise in [-1,1] → [0,1]. Time arg is fixed (0) so the blob is
            // deterministic per page load (the noise permutation table itself
            // is randomised at module init, so each refresh gives a new shape).
            const n = (noise3D(node.x * blobFreq, node.y * blobFreq, 0) + 1) * 0.5;

            // Combined acceptance score. Threshold ~0.45 gives chunky lobes;
            // higher = smaller blob, lower = closer to a full disc.
            const score = radial * (0.55 + n * 0.5);
            if (score > 0.45) candidates.push({ node, score });
        }

        // Take the strongest candidates up to the target count — gives the
        // densest core and naturally trims the soft edge.
        candidates.sort((a, b) => b.score - a.score);
        const seedCount = Math.min(target | 0, candidates.length);
        for (let i = 0; i < seedCount; i++) {
            const node = candidates[i].node;
            nuclei.push({
                currentNode: node,
                nextNode: node,
                progress: 0,
            });
        }
    }

    function resize() {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        dpr = window.devicePixelRatio || 1;
        width = rect.width;
        height = rect.height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        // setTransform (vs scale) avoids cumulative scaling on resize.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Always rebuild the grid on resize — it's cheap (<5ms typical) and
        // sidesteps the antimetal-replica's fragile incremental-grow code.
        initGrid();
        lastSpacing = config.gridSpacing;
    }

    // ── pointer interaction ──
    // Drag-to-paint nuclei onto the grid. The same node won't be re-seeded
    // back-to-back (lastAddedNodeId guard) so a slow drag doesn't stack
    // hundreds on one cell.
    function spawnNucleusAt(px, py) {
        const sp = config.gridSpacing;
        const col = Math.round(px / sp);
        const row = Math.round(py / sp);
        const node = nodes.find((n) => n.col === col && n.row === row);
        if (node && node.id !== lastAddedNodeId) {
            nuclei.push({ currentNode: node, nextNode: node, progress: 1 });
            lastAddedNodeId = node.id;
        }
    }

    function pointerToCanvas(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    const onPointerDown = (e) => {
        isPointerDown = true;
        const { x, y } = pointerToCanvas(e);
        spawnNucleusAt(x, y);
    };
    const onPointerMove = (e) => {
        if (!isPointerDown) return;
        const { x, y } = pointerToCanvas(e);
        spawnNucleusAt(x, y);
    };
    const onPointerUp = () => {
        isPointerDown = false;
        lastAddedNodeId = -1;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Drive resize via ResizeObserver — same pattern as the halftone hero.
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    resize();

    // ── one simulation tick: move nuclei, update activations ──
    function step() {
        const p = config;
        time += 0.01 * p.globalSpeed;

        // Right-bias ramp. Eases from 0 → p.rightBias over rightBiasRamp
        // seconds so the initially-uniform field redistributes smoothly
        // toward the right half (rather than snapping). Using a smoothstep
        // for the ramp gives a soft start AND a soft settle.
        if (bootMs === 0) bootMs = performance.now();
        let bias = 0;
        if (p.rightBias > 0) {
            const ramp = Math.max(0.001, p.rightBiasRamp);
            const t01 = Math.min(1, (performance.now() - bootMs) / 1000 / ramp);
            const ease = t01 * t01 * (3 - 2 * t01); // smoothstep
            bias = p.rightBias * ease;
        }

        // Centre of mass of all nuclei — used as the target for the
        // "cohesion" steering term (a pull toward the cluster centre).
        // When rightBias is active we *shift* the target rightward so the
        // cluster slowly drifts to the right half of the canvas.
        let comX = width / 2;
        let comY = height / 2;
        if (nuclei.length > 0) {
            let sx = 0;
            let sy = 0;
            for (const n of nuclei) {
                sx += n.currentNode.x;
                sy += n.currentNode.y;
            }
            comX = sx / nuclei.length;
            comY = sy / nuclei.length;
        }
        if (bias > 0) {
            // Aim cohesion only slightly right of centre (~55% width
            // when fully biased). The hard right-bias job is done by
            // the left-load cap below — cohesion only tilts the
            // collective wandering target a bit, so left nuclei aren't
            // permanently pulled away and can still wander into empty
            // regions.
            const targetX = width * (0.5 + 0.05 * bias);
            comX = comX * (1 - bias * 0.5) + targetX * bias * 0.5;
        }

        // Advance progress along each nucleus' current edge. When progress
        // reaches 1 we land on nextNode and may split. Splitting is
        // *not* spatially restricted — every region can grow. The
        // left-load cap below is what keeps the left half from getting
        // dense; it migrates excess left nuclei to the right rather than
        // suppressing left-side splits at the source. This keeps
        // diffusion across the whole canvas natural.
        for (const n of nuclei) {
            n.progress += p.nucleusSpeed * p.globalSpeed;
            if (n.progress >= 1) {
                n.currentNode = n.nextNode;
                n.progress = 0;
                if (
                    Math.random() < p.nucleusSplitProb &&
                    nuclei.length < nodes.length * p.nucleusCountRatio * 2
                ) {
                    const cands = n.currentNode.neighbors;
                    if (cands.length > 0) {
                        nuclei.push({
                            currentNode: n.currentNode,
                            nextNode: cands[(Math.random() * cands.length) | 0],
                            progress: 0,
                        });
                    }
                }
            }
        }

        // Cap nuclei per node so dense clusters can't deadlock.
        const byNode = new Map();
        for (const n of nuclei) {
            const list = byNode.get(n.currentNode.id) || [];
            list.push(n);
            byNode.set(n.currentNode.id, list);
        }
        const next = [];
        byNode.forEach((list) => {
            if (list.length > p.nucleusMaxPerCell) {
                next.push(...list.slice(0, p.nucleusMaxPerCell));
            } else {
                next.push(...list);
            }
        });
        nuclei = next;

        // Homeostasis — gently nudge population toward target. Cap-per-frame
        // (the Math.min term) keeps the growth slow & visible: a tight seed
        // blob takes ~30s to spread to nucleusCountRatio rather than filling
        // the screen on frame 2.
        //
        // When `bias > 0` (right-biased layout) we pick *right-leaning*
        // parents to clone from and *left-leaning* nuclei to kill, so the
        // population gradient drifts rightward over time without ever
        // teleporting individual nuclei. The bias-weighted picker is a
        // simple pow() on a random index after sorting by x.
        const target = nodes.length * p.nucleusCountRatio;
        const diff = target - nuclei.length;
        const pickBiased = (preferHigh) => {
            if (nuclei.length === 0) return -1;
            if (bias <= 0) return (Math.random() * nuclei.length) | 0;
            // sortable index list of (idx, x) — cheap O(n log n) on a few
            // hundred items, only triggered when bias > 0.
            const ord = nuclei
                .map((n, i) => [i, n.currentNode.x])
                .sort((a, b) => a[1] - b[1]);
            // exponent grows with bias: 1 = uniform, 4 = strongly weighted.
            const exp = 1 + 3 * bias;
            const r = Math.random();
            // r^exp ∈ [0,1]: small for low r, near 1 for large r → biased
            // toward the *end* of the sorted list (rightmost) when
            // preferHigh, otherwise toward the *start* (leftmost).
            const t = preferHigh ? 1 - Math.pow(1 - r, exp) : Math.pow(r, exp);
            const k = Math.min(ord.length - 1, (t * ord.length) | 0);
            return ord[k][0];
        };
        if (diff > 0 && p.homeostasisRate > 0) {
            const spawn = Math.min(2, Math.ceil(diff * p.homeostasisRate * 0.1));
            for (let i = 0; i < spawn; i++) {
                if (nuclei.length > 0 && Math.random() >= p.randomSpawnProb) {
                    const parent = nuclei[pickBiased(true)];
                    nuclei.push({
                        currentNode: parent.currentNode,
                        nextNode: parent.currentNode,
                        progress: 1,
                    });
                } else if (nodes.length > 0) {
                    // Random spawn: full-screen pool. The left-load cap
                    // below handles right-bias by migrating excess left
                    // nuclei rightward, so we don't need to bias the
                    // spawn pool itself. Keeping spawns full-screen is
                    // what gives every region (including left) signal.
                    const node = nodes[(Math.random() * nodes.length) | 0];
                    nuclei.push({ currentNode: node, nextNode: node, progress: 1 });
                }
            }
        } else if (diff < 0 && p.homeostasisRate > 0) {
            const kill = Math.min(5, Math.ceil(-diff * p.homeostasisRate * 0.1));
            for (let i = 0; i < kill && nuclei.length > 0; i++) {
                const k = pickBiased(false);
                if (k >= 0) nuclei.splice(k, 1);
            }
        }

        // Left-load corridor. Two-sided control:
        //   - if left half exceeds budget+1 → migrate one excess left
        //     nucleus to a right-half node (cap)
        //   - if left half is below budget × 0.5 → migrate one right-half
        //     nucleus to a random left-half node (floor)
        // Together this keeps the left in a [50% × budget … 100% × budget]
        // corridor so every region stays populated without crowding the
        // text column. Only runs when bias > 0.
        if (bias > 0 && p.leftLoadFactor > 0 && nuclei.length > 4) {
            let leftCount = 0;
            let leftNodeCount = 0;
            const halfX = width * 0.5;
            for (const n of nuclei) if (n.currentNode.x < halfX) leftCount++;
            for (const node of nodes) {
                if (node.x >= 0 && node.x < halfX && node.y >= 0 && node.y <= height) {
                    leftNodeCount++;
                }
            }
            const leftBudget =
                leftNodeCount * p.nucleusCountRatio * p.leftLoadFactor;
            if (leftCount > leftBudget + 1) {
                // Over the cap → drain one excess left nucleus rightward.
                const leftIdx = [];
                for (let i = 0; i < nuclei.length; i++) {
                    if (nuclei[i].currentNode.x < halfX) leftIdx.push(i);
                }
                if (leftIdx.length > 0) {
                    const k = leftIdx[(Math.random() * leftIdx.length) | 0];
                    const pool = nodes.filter((n) => n.x >= halfX + 20);
                    if (pool.length > 0) {
                        const dest = pool[(Math.random() * pool.length) | 0];
                        nuclei.splice(k, 1);
                        nuclei.push({
                            currentNode: dest,
                            nextNode: dest,
                            progress: 1,
                        });
                    }
                }
            } else if (leftCount < leftBudget * 0.5) {
                // Under the floor → migrate one right-half nucleus into a
                // random *visible* left-half node, so the left side never
                // drops below the user-requested "every region populated"
                // threshold even when noise/cohesion drains it.
                const rightIdx = [];
                for (let i = 0; i < nuclei.length; i++) {
                    if (nuclei[i].currentNode.x >= halfX) rightIdx.push(i);
                }
                if (rightIdx.length > 0) {
                    const k = rightIdx[(Math.random() * rightIdx.length) | 0];
                    const leftPool = nodes.filter(
                        (n) => n.x >= 0 && n.x < halfX - 20 && n.y >= 0 && n.y <= height,
                    );
                    if (leftPool.length > 0) {
                        const dest = leftPool[(Math.random() * leftPool.length) | 0];
                        nuclei.splice(k, 1);
                        nuclei.push({
                            currentNode: dest,
                            nextNode: dest,
                            progress: 1,
                        });
                    }
                }
            }
        }

        // Choose nextNode for each nucleus that has just landed (progress=0).
        // The decision blends three steering inputs:
        //   noise:    spatially-coherent wandering (Simplex 3D)
        //   cohesion: a pull toward the cluster centre of mass
        //   boids:    separation/alignment/cohesion against nearby nuclei
        for (let idx = 0; idx < nuclei.length; idx++) {
            const n = nuclei[idx];
            if (n.progress !== 0) {
                // Activate the current and next nodes proportionally.
                n.currentNode.activation += p.activationGrow * p.globalSpeed;
                n.nextNode.activation +=
                    p.activationGrow * n.progress * p.globalSpeed;
                continue;
            }

            const cands = n.currentNode.neighbors;
            if (cands.length === 0) continue;

            const freq = 0.01 * p.wanderSparsity;
            const nx = noise3D(
                n.currentNode.x * freq,
                n.currentNode.y * freq,
                time * 0.5,
            );
            const ny = noise3D(
                n.currentNode.x * freq + 100,
                n.currentNode.y * freq,
                time * 0.5,
            );

            let dirX = 0;
            let dirY = 0;
            if (p.clusterCohesion > 0) {
                const tx = comX - n.currentNode.x;
                const ty = comY - n.currentNode.y;
                const d = Math.hypot(tx, ty);
                if (d > 0.001) {
                    dirX = tx / d;
                    dirY = ty / d;
                }
            }

            let bX = 0;
            let bY = 0;
            if (p.boidsWeight > 0) {
                let sepX = 0,
                    sepY = 0,
                    aliX = 0,
                    aliY = 0,
                    cohX = 0,
                    cohY = 0;
                let nb = 0;
                const radius = p.gridSpacing * 4;
                const sepR = p.gridSpacing * 1.5;
                for (const o of nuclei) {
                    if (o === n) continue;
                    const ox = o.currentNode.x - n.currentNode.x;
                    const oy = o.currentNode.y - n.currentNode.y;
                    const d = Math.hypot(ox, oy);
                    if (d > 0.001 && d < radius) {
                        nb++;
                        aliX += o.nextNode.x - o.currentNode.x;
                        aliY += o.nextNode.y - o.currentNode.y;
                        cohX += o.currentNode.x;
                        cohY += o.currentNode.y;
                        if (d < sepR) {
                            sepX -= ox / d / d;
                            sepY -= oy / d / d;
                        }
                    }
                }
                if (nb > 0) {
                    aliX /= nb;
                    aliY /= nb;
                    cohX = cohX / nb - n.currentNode.x;
                    cohY = cohY / nb - n.currentNode.y;
                    const lA = Math.hypot(aliX, aliY) + 0.001;
                    const lC = Math.hypot(cohX, cohY) + 0.001;
                    const lS = Math.hypot(sepX, sepY) + 0.001;
                    bX = (aliX / lA) + (cohX / lC) + (sepX / lS) * 1.5;
                    bY = (aliY / lA) + (cohY / lC) + (sepY / lS) * 1.5;
                    const lB = Math.hypot(bX, bY) + 0.001;
                    bX /= lB;
                    bY /= lB;
                }
            }

            const isCohesive = idx / nuclei.length < p.cohesionRatio;
            const wCoh = isCohesive ? p.clusterCohesion : 0;
            const wBoids = p.boidsWeight;
            const wNoise = 1.0 - wCoh - wBoids * 0.5;

            const indivX = noise3D(idx * 0.1, time * 0.5, 0) * 0.3;
            const indivY = noise3D(time * 0.5, idx * 0.1, 100) * 0.3;
            const cX = nx * wNoise + dirX * wCoh + indivX * wNoise + bX * wBoids;
            const cY = ny * wNoise + dirY * wCoh + indivY * wNoise + bY * wBoids;

            // Pick the neighbour whose direction maximally aligns with cX/cY.
            let best = cands[0];
            let bestScore = -Infinity;
            for (const cand of cands) {
                const dx = cand.col - n.currentNode.col;
                const dy = cand.row - n.currentNode.row;
                const len = Math.hypot(dx, dy) || 1;
                const score = (dx / len) * cX + (dy / len) * cY;
                if (score > bestScore) {
                    bestScore = score;
                    best = cand;
                }
            }
            n.nextNode = best;

            n.currentNode.activation += p.activationGrow * p.globalSpeed;
        }

        // Per-node decay + membrane radius easing.
        for (const node of nodes) {
            node.activation -= p.activationDecay * p.globalSpeed;
            if (node.activation < 0) node.activation = 0;
            else if (node.activation > 1.2) node.activation = 1.2;

            // Cap the *visible* membrane radius at cellMaxRadius exactly.
            // We still let activation overshoot to 1.2 internally so a
            // cell that's been hit by several nuclei has a small reservoir
            // before it starts shrinking — but once it comes to drawing
            // the circle, we clamp the multiplier to 1.0 so themes can
            // treat cellMaxRadius as the geometric upper bound.
            //
            // Without this clamp, cellMaxRadius behaved as a *base* radius
            // and the real maximum was 1.2× larger, which made adjacent
            // circles overlap when a theme set cellMaxRadius = gridSpacing/2
            // expecting them to just kiss.
            const visAct = node.activation > 1 ? 1 : node.activation;
            const targetR = visAct * p.cellMaxRadius;
            const speed =
                targetR > node.membraneRadius
                    ? p.membraneGrowSpeed
                    : p.membraneDecaySpeed;
            node.membraneRadius +=
                (targetR - node.membraneRadius) * speed * p.globalSpeed;
        }
    }

    // ── one paint pass ──
    function draw() {
        const p = config;
        const memRgb = hexToRgb(p.membraneColor);
        const connRgb = hexToRgb(p.connectionColor);
        const nucRgb = hexToRgb(p.nucleusColor);

        // Ghost-trail fade. We don't fill with bgColor — the CSS hero-bg
        // gradient lives behind the canvas, so leaving the fade transparent
        // lets that gradient show through exactly like the halftone engine.
        if (p.ghostTrail > 0 && p.ghostTrail < 1) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = `rgba(0, 0, 0, ${1 - p.ghostTrail})`;
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = "source-over";
        } else if (p.ghostTrail >= 1) {
            // Persistent trails never fade — clearing once on the first
            // frame is fine; subsequent frames just keep painting on top.
        } else {
            ctx.clearRect(0, 0, width, height);
        }

        // Connections between activated neighbours.
        ctx.lineWidth = p.membraneStrokeWidth;
        if (p.connectionOpacity > 0) {
            for (const node of nodes) {
                if (node.activation < 0.1) continue;
                for (const nb of node.neighbors) {
                    if (nb.id <= node.id || nb.activation < 0.1) continue;
                    const op =
                        Math.min(node.activation, nb.activation) *
                        p.connectionOpacity;
                    if (op < 0.02) continue;
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(nb.x, nb.y);
                    ctx.strokeStyle = `rgba(${connRgb}, ${op})`;
                    ctx.stroke();
                }
            }
        }

        // Membranes + static centre dots (only visible while activated).
        for (const node of nodes) {
            if (node.membraneRadius < 0.5) continue;
            const op = Math.max(
                0,
                Math.min(1, node.activation * p.membraneOpacity),
            );
            if (op < 0.02) continue;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.membraneRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${memRgb}, ${op})`;
            ctx.stroke();
            if (node.activation > 0.5) {
                ctx.beginPath();
                ctx.arc(
                    node.x,
                    node.y,
                    p.nucleusSize * Math.min(1, node.activation) * 0.7,
                    0,
                    Math.PI * 2,
                );
                ctx.fillStyle = `rgba(${nucRgb}, ${op * 0.5})`;
                ctx.fill();
            }
        }

        // Travelling nuclei — interpolated along their current edge.
        ctx.fillStyle = p.nucleusColor;
        for (const n of nuclei) {
            const x =
                n.currentNode.x +
                (n.nextNode.x - n.currentNode.x) * n.progress;
            const y =
                n.currentNode.y +
                (n.nextNode.y - n.currentNode.y) * n.progress;
            ctx.beginPath();
            ctx.arc(x, y, p.nucleusSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Soft radial vignette: dims the field toward the corners. Drawn
        // on top in destination-out so the existing pixels lose alpha
        // smoothly without washing the bgColor in.
        if (p.vignetteStrength > 0) {
            const cx = width / 2;
            const cy = height / 2;
            const r = Math.hypot(cx, cy);
            const grad = ctx.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
            grad.addColorStop(0, "rgba(0,0,0,0)");
            grad.addColorStop(1, `rgba(0,0,0,${p.vignetteStrength})`);
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = "source-over";
        }
    }

    const render = () => {
        if (stopped) return;
        if (lastSpacing !== config.gridSpacing) {
            initGrid();
            lastSpacing = config.gridSpacing;
            ctx.clearRect(0, 0, width, height);
        }
        step();
        draw();
        raf = requestAnimationFrame(render);
    };
    render();

    return {
        cleanup() {
            stopped = true;
            cancelAnimationFrame(raf);
            if (ro) ro.disconnect();
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            canvas.remove();
        },
        // Exposed for live tweaking via window.__hero (parity with halftone).
        config,
    };
}
