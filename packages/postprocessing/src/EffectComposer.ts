import { HalfFloatType } from 'three'
import type { Camera, Scene, Texture, WebGLRenderer } from 'three'
import { EffectComposer as BaseEffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset, EdgeDetectionMode } from 'postprocessing'
import { DrawEffect } from './DrawEffect.js'
import type { DrawParams } from './DrawEffect.js'
import { ColorChannelEffect, normalizeColorChannel } from './ColorChannelEffect.js'
import type { ColorChannel } from './ColorChannelEffect.js'
import { resolveMultisampling } from './antialiasing.js'

export interface ShaderEffectComposerOptions {
    draw?: DrawParams
    paperTexture?: Texture | null
    drawEnabled?: boolean
    antialiasing?: boolean
    colorChannel?: ColorChannel
    /** Use false when the composer output is consumed as a texture. */
    renderToScreen?: boolean
    smaaPreset?: SMAAPreset
    edgeDetectionMode?: EdgeDetectionMode
    multisampling?: number | 'auto'
    frameBufferType?: number
    depthBuffer?: boolean
    stencilBuffer?: boolean
}

/** Scene → ink/channel conversion → SMAA. No React or asset-loading dependency. */
export class ShaderEffectComposer extends BaseEffectComposer {
    readonly renderPass: RenderPass
    readonly drawEffect: DrawEffect
    readonly drawPass: EffectPass
    readonly colorChannelEffect: ColorChannelEffect
    readonly colorChannelPass: EffectPass
    readonly smaaEffect: SMAAEffect
    readonly smaaPass: EffectPass
    colorChannel: ColorChannel = 'all'
    private outputToScreen: boolean
    private requestedSamples: number | 'auto'

    constructor(renderer: WebGLRenderer, scene: Scene, camera: Camera, options: ShaderEffectComposerOptions = {}) {
        const requestedSamples = options.multisampling ?? 'auto'
        super(renderer, {
            frameBufferType: options.frameBufferType ?? HalfFloatType,
            depthBuffer: options.depthBuffer ?? true,
            stencilBuffer: options.stencilBuffer ?? false,
            multisampling: resolveMultisampling(renderer.getPixelRatio(), requestedSamples, renderer.capabilities.maxSamples),
        })
        this.autoRenderToScreen = false
        this.outputToScreen = options.renderToScreen ?? true
        this.requestedSamples = requestedSamples
        this.renderPass = new RenderPass(scene, camera)
        this.drawEffect = new DrawEffect({ ...options.draw, paperTexture: options.paperTexture })
        this.drawPass = new EffectPass(camera, this.drawEffect)
        this.colorChannelEffect = new ColorChannelEffect()
        this.colorChannelPass = new EffectPass(camera, this.colorChannelEffect)
        this.smaaEffect = new SMAAEffect({
            preset: options.smaaPreset ?? SMAAPreset.HIGH,
            edgeDetectionMode: options.edgeDetectionMode ?? EdgeDetectionMode.LUMA,
        })
        this.smaaPass = new EffectPass(camera, this.smaaEffect)
        this.addPass(this.renderPass)
        this.addPass(this.colorChannelPass)
        this.addPass(this.drawPass)
        this.addPass(this.smaaPass)
        this.drawPass.enabled = options.drawEnabled ?? true
        this.smaaPass.enabled = options.antialiasing ?? true
        this.setColorChannel(options.colorChannel ?? 'all')
    }

    setOptions(params: DrawParams): void {
        this.drawEffect.setParams(params)
    }
    setDrawParams(params: DrawParams): void {
        this.drawEffect.setParams(params)
    }
    setPaperTexture(texture: Texture | null): void {
        this.drawEffect.setPaperTexture(texture)
    }
    getEffect(mode: string): DrawEffect | null {
        return mode === 'draw' ? this.drawEffect : null
    }
    setEffectParams(mode: string, params: DrawParams): void {
        this.getEffect(mode)?.setParams(params)
    }

    setColorChannel(channel: ColorChannel): void {
        this.colorChannel = normalizeColorChannel(channel)
        this.colorChannelEffect.setChannel(this.colorChannel)
        this.drawEffect.setColorChannel(this.colorChannel)
        this.updateOutputPass()
    }

    setDrawEffectEnabled(enabled = true): void {
        this.drawPass.enabled = Boolean(enabled)
        this.updateOutputPass()
    }

    setAntialiasingEnabled(enabled = true): void {
        this.smaaPass.enabled = Boolean(enabled)
        this.updateOutputPass()
    }

    setRenderToScreen(enabled: boolean): void {
        this.outputToScreen = enabled
        this.updateOutputPass()
    }

    setMultisampling(samples: number | 'auto'): void {
        this.requestedSamples = samples
        this.updateMultisampling()
    }

    /** Call after renderer.setPixelRatio(...); setSize also calls this automatically. */
    updateMultisampling(): void {
        const renderer = this.getRenderer()
        const samples = resolveMultisampling(renderer.getPixelRatio(), this.requestedSamples, renderer.capabilities.maxSamples)
        if (this.multisampling !== samples) this.multisampling = samples
    }

    setSize(width: number, height: number, updateStyle = false): void {
        // Base construction may invoke setSize before our configuration exists.
        if (this.requestedSamples !== undefined) this.updateMultisampling()
        super.setSize(width, height, updateStyle)
    }

    /** Re-evaluate output routing after adding/removing a custom pass. */
    updateOutputPass(): void {
        this.colorChannelPass.enabled = !this.drawPass.enabled && (this.colorChannel !== 'all' || !this.smaaPass.enabled)
        let output = null
        for (const pass of this.passes) {
            pass.renderToScreen = false
            if (pass.enabled) output = pass
        }
        if (output) output.renderToScreen = this.outputToScreen
    }
}

export { ShaderEffectComposer as EffectComposer }
