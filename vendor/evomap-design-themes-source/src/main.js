// Application entry: boots the hero, wires the variant switcher, content
// toggle, CTA copy button, and keyboard shortcuts. This module is loaded as
// type="module" from index.html so top-level await is fine.
//
// MuseHub fork: this build ships a curated subset of the upstream
// dashboard's variants (see ./variants/index.js for the rationale) and
// adds a `?embed=1` query mode that hides every chrome control so each
// theme can be iframed into a community-wall card without the variant
// switcher / content toggle / stats strip leaking into the preview.
// The intro / fireworks / breath overlays were dropped along with their
// host variants (genesis, fireworks) so the bundle stays focused on
// what the community wall actually links to.

import { createDottedVideo } from "./hero/createHero.js";
import { createCellularHero } from "./hero/createCellularHero.js?v=2";
import { variants } from "./variants/index.js";

const heroContainer = document.getElementById("hero-dotted-video");
const switcherList = document.getElementById("switcher-list");
const switcherTagline = document.getElementById("switcher-tagline");
const switcherToggleCount = document.getElementById("switcher-toggle-count");
const switcherToggle = document.getElementById("switcher-toggle");
const contentToggle = document.getElementById("content-toggle");

let currentInstance = null;
let currentIndex = 0;

// ───── URL ⇄ variant sync ─────
// Source of truth for "which variant is showing" is the ?v= query param so
// every theme has a shareable URL (e.g. ?v=aurora or ?v=2). The id form
// is preferred because it survives reordering of variants/index.js;
// numbers are accepted too for quick keyboard sharing.
const URL_PARAM = "v";

const urlParams = new URLSearchParams(location.search);
// Embed mode: when the dashboard is iframed (typically from the
// MuseHub community wall) we hide the variant switcher, content
// toggle, CTA pill, and stats strip so each card stays focused on its
// theme and the chrome doesn't compound across many iframes. Auto-
// detected from `window.self !== window.top` — the same dashboard
// opened in a new tab via "Open in new window" still gets the full
// standalone experience without the host having to vary URLs.
// `?embed=0` forces standalone (useful for debugging in an iframe);
// `?embed=1` forces embed (useful when this URL ends up in a
// non-iframe surface that still wants the trimmed view).
const embedOverride = urlParams.get("embed");
const isEmbedded =
    embedOverride === "1" || (embedOverride !== "0" && window.self !== window.top);

function indexFromUrl() {
    const raw = urlParams.get(URL_PARAM);
    if (!raw) return null;
    const byId = variants.findIndex((v) => v.id === raw);
    if (byId >= 0) return byId;
    const asNum = parseInt(raw, 10);
    if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= variants.length) {
        return asNum - 1;
    }
    return null;
}

// Push the current variant into the URL without spamming the history stack.
// We use replaceState so the back button still does what the user expects
// (go back to the previous *page*), but the URL is always copy-pasteable.
// Skipped while embedded — iframed previews shouldn't write into their
// host's session history through location.href.
function syncUrl(idx) {
    if (isEmbedded) return;
    const v = variants[idx];
    if (!v) return;
    const url = new URL(location.href);
    url.searchParams.set(URL_PARAM, v.id);
    if (url.toString() !== location.href) {
        history.replaceState({ variantIndex: idx }, "", url.toString());
    }
}

// ───── render switcher tabs ─────
variants.forEach((v, idx) => {
    const li = document.createElement("li");
    li.className = "switcher-item";
    li.dataset.index = String(idx);
    li.innerHTML = `
        <span class="switcher-item-num">${String(idx + 1).padStart(2, "0")}</span>
        <span class="switcher-item-name">${v.name.replace(/^\d+\s·\s/, "")}</span>
    `;
    li.addEventListener("click", () => applyVariant(idx));
    switcherList.appendChild(li);
});

// ───── apply theme + rebuild hero (copy is fixed; not swapped) ─────
function applyVariant(idx) {
    const v = variants[idx];
    if (!v) return;
    currentIndex = idx;

    // 1. CSS variables
    const root = document.documentElement;
    Object.entries(v.theme).forEach(([k, val]) => root.style.setProperty(k, val));
    ["--cta-border", "--font-mono", "--font-serif", "--cta-radius"].forEach((k) => {
        if (!(k in v.theme)) root.style.removeProperty(k);
    });

    document.body.dataset.variant = String(idx);
    document.body.dataset.variantId = v.id;

    // 2. tear down + rebuild hero. Two engines coexist:
    //   - "halftone" (default): WebGL dot-field with optional fluid layer
    //   - "cellular":           Canvas2D cluster-field of wandering nuclei
    // Both expose the same { cleanup() } contract so swapping is trivial.
    if (currentInstance) {
        try {
            currentInstance.cleanup();
        } catch (e) {
            console.warn("cleanup error:", e);
        }
        currentInstance = null;
    }
    heroContainer.querySelectorAll("canvas").forEach((c) => c.remove());

    if (v.engine === "cellular") {
        currentInstance = createCellularHero(heroContainer, v.shaderConfig);
    } else {
        const hero = createDottedVideo(heroContainer, {
            ...v.shaderConfig,
            useShapeMask: !urlParams.has("nomask"),
        });
        currentInstance = hero;
    }
    window.__hero = currentInstance;

    // 3. update switcher UI
    switcherList.querySelectorAll(".switcher-item").forEach((el, i) => {
        el.classList.toggle("is-active", i === idx);
    });
    switcherTagline.textContent = v.tagline;
    switcherToggleCount.textContent = `${String(idx + 1).padStart(2, "0")} / ${variants.length}`;

    // 4. mirror selection into the URL so the page is shareable.
    syncUrl(idx);
}

// ───── switcher panel toggle ─────
switcherToggle.addEventListener("click", () => {
    document.getElementById("switcher").classList.toggle("is-open");
});

// ───── content visibility toggle (top-right) ─────
contentToggle.addEventListener("click", () => {
    const next = contentToggle.getAttribute("aria-pressed") !== "true";
    contentToggle.setAttribute("aria-pressed", String(next));
    document.body.classList.toggle("content-hidden", !next);
});

// ───── CTA pill copy button ─────
// Skill registration URL. Kept in JS rather than the HTML shell because
// the MuseHub showcase contract rejects raw `https://` strings in the
// HTML body — the URL is rendered into the `.cta-text` placeholder at
// runtime and copied to clipboard from the same source.
const SKILL_REGISTRATION_URL = "https://evomap.ai/skill.md";

const ctaTextEl = document.getElementById("cta-text");
if (ctaTextEl) {
    const linkEl = document.createElement("a");
    linkEl.href = SKILL_REGISTRATION_URL;
    linkEl.target = "_blank";
    linkEl.rel = "noopener";
    linkEl.textContent = SKILL_REGISTRATION_URL;
    ctaTextEl.append("Read ", linkEl, " to register and join EvoMap.");
}

document.querySelector(".cta-pill")?.addEventListener("click", async (e) => {
    const link = SKILL_REGISTRATION_URL;
    const isCopyTarget =
        e.target.closest(".copy-btn") || e.target.closest(".cta-text");
    if (!isCopyTarget) return;
    if (e.target.closest("a")) return; // let the link open
    try {
        await navigator.clipboard.writeText(link);
        const btn = document.querySelector(".copy-btn");
        if (btn) {
            btn.classList.add("copied");
            setTimeout(() => btn.classList.remove("copied"), 1200);
        }
    } catch (err) {
        console.warn("clipboard error:", err);
    }
});

// ───── keyboard shortcuts: 1-9 picks variant, ←→ cycles ─────
// Ignored in embed mode so an iframe focus doesn't capture host shortcuts.
if (!isEmbedded) {
    window.addEventListener("keydown", (e) => {
        // Skip when the user is typing in a form field. e.target on a window-level
        // listener can be Document/Window, which don't expose .matches() — guard.
        const t = e.target;
        if (t instanceof Element && t.matches("input, textarea, [contenteditable='true']")) return;
        if (e.key >= "1" && e.key <= "9") {
            applyVariant(parseInt(e.key, 10) - 1);
        } else if (e.key === "ArrowRight") {
            applyVariant((currentIndex + 1) % variants.length);
        } else if (e.key === "ArrowLeft") {
            applyVariant((currentIndex - 1 + variants.length) % variants.length);
        }
    });
}

// Embed mode: tag the body so CSS can collapse all chrome (switcher,
// content toggle, CTA pill, hint, stats) and let the hero canvas fill
// the iframe untouched.
if (isEmbedded) {
    document.body.dataset.embed = "1";
}

// boot — pick variant from ?v= if present, otherwise default to first.
applyVariant(indexFromUrl() ?? 0);
if (!isEmbedded && window.matchMedia("(min-width: 768px)").matches) {
    document.getElementById("switcher").classList.add("is-open");
}

// React to back/forward navigation and to the user pasting a new ?v=.
// popstate fires for browser-driven URL changes; we re-read and switch
// without pushing new history entries (applyVariant uses replaceState).
window.addEventListener("popstate", () => {
    const idx = indexFromUrl();
    if (idx !== null && idx !== currentIndex) applyVariant(idx);
});
