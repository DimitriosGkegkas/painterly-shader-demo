import { Effect, EffectAttribute } from 'postprocessing'
import { Color, Uniform, Vector2, Vector3 } from 'three'
import type { ColorRepresentation, Texture, WebGLRenderer, WebGLRenderTarget } from 'three'
import { drawFragmentShader } from './shaders/index.js'
import { CHANNEL_MASKS, normalizeColorChannel } from './ColorChannelEffect.js'
import type { ColorChannel } from './ColorChannelEffect.js'

export interface DrawParams {
    /** Reveal amount, clamped to 0–1 by the shader. */
    appearance?: number
    /** Three.js color: CSS/hex inputs are sRGB; Color instances are linear. */
    inkColor?: ColorRepresentation
    outlineColor?: ColorRepresentation
    textureStrength?: number
    /** Average paper brightness in sRGB (0–1). */
    paperMidpoint?: number
    /** Outline sampling radius in CSS pixels, independent of DPR. */
    edgeRadius?: number
    edgeStrength?: number
    usePaperTexture?: boolean
}

export interface DrawEffectOptions extends DrawParams {
    /** Caller-owned sRGB texture. No texture means a white paper background. */
    paperTexture?: Texture | null
    colorChannel?: ColorChannel
}

export const DRAW_DEFAULTS = Object.freeze({
    appearance: 1,
    inkColor: 'rgb(51%, 22%, 5%)',
    outlineColor: '#000000',
    textureStrength: 10,
    paperMidpoint: 0.734,
    edgeRadius: 0.5,
    edgeStrength: 2,
    usePaperTexture: true,
})

/** Ink rendering for the RGB data channels emitted by CartoonBlobFiberMaterial. */
export class DrawEffect extends Effect {
    private paperEnabled = true

    constructor(options: DrawEffectOptions = {}) {
        super('DrawEffect', drawFragmentShader, {
            attributes: EffectAttribute.CONVOLUTION,
            uniforms: new Map<string, Uniform>([
                ['appearance', new Uniform(DRAW_DEFAULTS.appearance)],
                ['inkColor', new Uniform(new Color(DRAW_DEFAULTS.inkColor))],
                ['outlineColor', new Uniform(new Color(DRAW_DEFAULTS.outlineColor))],
                ['textureStrength', new Uniform(DRAW_DEFAULTS.textureStrength)],
                ['paperMidpoint', new Uniform(DRAW_DEFAULTS.paperMidpoint)],
                ['edgeRadius', new Uniform(DRAW_DEFAULTS.edgeRadius)],
                ['edgeStrength', new Uniform(DRAW_DEFAULTS.edgeStrength)],
                ['paperTexture', new Uniform<Texture | null>(null)],
                ['usePaperTexture', new Uniform(false)],
                ['edgeViewportSize', new Uniform(new Vector2(1, 1))],
                ['channelMask', new Uniform(new Vector3(1, 1, 1))],
            ]),
        })
        this.setParams(options)
        this.setPaperTexture(options.paperTexture ?? null)
        this.setColorChannel(options.colorChannel ?? 'all')
    }

    /** Updates uniforms in place without allocating a new effect or shader program. */
    setParams(params: DrawParams = {}): void {
        for (const key of ['appearance', 'textureStrength', 'paperMidpoint', 'edgeRadius', 'edgeStrength'] as const) {
            const value = params[key]
            if (value !== undefined) {
                if (!Number.isFinite(value)) throw new TypeError(`${key} must be finite`)
                this.uniforms.get(key)!.value = value
            }
        }
        for (const key of ['inkColor', 'outlineColor'] as const) {
            if (params[key] !== undefined) this.uniforms.get(key)!.value.set(params[key])
        }
        if (params.usePaperTexture !== undefined) this.paperEnabled = params.usePaperTexture
        this.updatePaperEnabled()
    }

    /** Alias retained for existing integrations. */
    setOptions(params: DrawParams): void {
        this.setParams(params)
    }

    getParams(): Required<DrawParams> {
        return {
            appearance: this.uniforms.get('appearance')!.value,
            inkColor: this.uniforms.get('inkColor')!.value.clone(),
            outlineColor: this.uniforms.get('outlineColor')!.value.clone(),
            textureStrength: this.uniforms.get('textureStrength')!.value,
            paperMidpoint: this.uniforms.get('paperMidpoint')!.value,
            edgeRadius: this.uniforms.get('edgeRadius')!.value,
            edgeStrength: this.uniforms.get('edgeStrength')!.value,
            usePaperTexture: this.paperEnabled,
        }
    }

    /** Neither replaces texture settings nor disposes the previous texture. */
    setPaperTexture(texture: Texture | null): void {
        this.uniforms.get('paperTexture')!.value = texture
        this.updatePaperEnabled()
    }

    setColorChannel(channel: ColorChannel): void {
        this.uniforms.get('channelMask')!.value.fromArray(CHANNEL_MASKS[normalizeColorChannel(channel)])
    }

    private updatePaperEnabled(): void {
        this.uniforms.get('usePaperTexture')!.value = this.paperEnabled && this.uniforms.get('paperTexture')!.value !== null
    }

    update(renderer: WebGLRenderer, _inputBuffer: WebGLRenderTarget, _deltaTime: number): void {
        renderer.getSize(this.uniforms.get('edgeViewportSize')!.value)
    }
}
