/** Keeps source MSAA at low DPR; a DPR of 2 already renders four pixels per CSS pixel. */
export function resolveMultisampling(dpr: number, requested: number | 'auto' = 'auto', maxSamples = 8): number {
    const samples = requested === 'auto' ? (dpr >= 2 ? 0 : 8) : requested
    if (!Number.isFinite(samples) || !Number.isFinite(maxSamples)) return 0
    return Math.max(0, Math.floor(Math.min(samples, maxSamples)))
}
