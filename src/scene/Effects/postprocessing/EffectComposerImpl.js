import { SRGBColorSpace } from 'three'
import { EffectComposer as EffectComposerImpl, EffectPass, RenderPass, SMAAEffect, SMAAPreset, EdgeDetectionMode } from 'postprocessing'
import { ColorChannelEffect, DrawEffect } from './effects'

class EffectComposer extends EffectComposerImpl {
    constructor(renderer, options) {
        super(renderer, options)

        this.renderPass = new RenderPass(this.scene, this.camera)

        this.smaaEffect = new SMAAEffect({ preset: SMAAPreset.HIGH, edgeDetectionMode: EdgeDetectionMode.LUMA })
        this.smaaPass = new EffectPass(this.camera, this.smaaEffect)

        this.drawEffect = new DrawEffect()
        this.drawPass = new EffectPass(this.camera, this.drawEffect)

        this.colorChannelEffect = new ColorChannelEffect()
        this.colorChannelPass = new EffectPass(this.camera, this.colorChannelEffect)

        this.addPass(this.renderPass)
        this.addPass(this.colorChannelPass)
        this.addPass(this.drawPass)
        // Smooth the final ink outlines after the draw shader has created them.
        this.addPass(this.smaaPass)

        renderer.outputColorSpace = SRGBColorSpace

        this.setDrawEffectEnabled(true)
    }

    setOptions(options) {
        this.drawEffect.setOptions(options)
    }

    getEffect(effectMode) {
        if (effectMode === 'draw') return this.drawEffect
        return null
    }

    setEffectParams(effectMode, params) {
        const effect = this.getEffect(effectMode)
        effect?.setParams?.(params)
    }

    setColorChannel(channel) {
        this.colorChannelEffect.setChannel(channel)
    }

    setDrawEffectEnabled(enabled = true) {
        this.drawPass.enabled = Boolean(enabled)
        this.updateOutputPass()
    }

    setAntialiasingEnabled(enabled = true) {
        this.smaaPass.enabled = Boolean(enabled)
        this.updateOutputPass()
    }

    updateOutputPass() {
        // Exactly one enabled pass presents the image, including when toggling effects.
        this.renderPass.renderToScreen = false
        this.colorChannelPass.renderToScreen = !this.drawPass.enabled && !this.smaaPass.enabled
        this.drawPass.renderToScreen = this.drawPass.enabled && !this.smaaPass.enabled
        this.smaaPass.renderToScreen = this.smaaPass.enabled
    }
}

export { EffectComposer }
