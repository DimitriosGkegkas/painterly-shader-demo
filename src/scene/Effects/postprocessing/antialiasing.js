// At DPR 2 the render already has four pixels per CSS pixel, and the 0.5-CSS-pixel
// edge radius spans a full render texel. Keep source MSAA on lower-density renders.
/**
 * @param {number} dpr
 * @param {number | 'auto'} requested
 * @param {number} maxSamples
 */
function resolveMultisampling(dpr, requested = 'auto', maxSamples = 8) {
    const samples = requested === 'auto' ? (dpr >= 2 ? 0 : 8) : requested
    return Math.max(0, Math.min(samples, maxSamples))
}

export { resolveMultisampling }
