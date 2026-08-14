import { SRGBColorSpace } from 'three'
import { EffectComposer as EffectComposerImpl, EffectPass, RenderPass, SMAAEffect } from 'postprocessing'
import { ColorChannelEffect, DrawEffect } from './effects'

class EffectComposer extends EffectComposerImpl {
    constructor(renderer, options) {
        super(renderer, options)

        this.renderPass = new RenderPass(this.scene, this.camera)

        this.smaaEffect = new SMAAEffect()
        this.smaaPass = new EffectPass(this.camera, this.smaaEffect)
        this.smaaEffect.samples = 4

        this.drawEffect = new DrawEffect()
        this.drawPass = new EffectPass(this.camera, this.drawEffect)

        this.colorChannelEffect = new ColorChannelEffect()
        this.colorChannelPass = new EffectPass(this.camera, this.colorChannelEffect)

        this.addPass(this.renderPass)
        this.addPass(this.colorChannelPass)
        this.addPass(this.drawPass)

        renderer.outputColorSpace = SRGBColorSpace
        this.smaaPass.outputColorSpace = 'srgb'

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
        const isDrawEnabled = Boolean(enabled)
        this.renderPass.renderToScreen = false
        this.colorChannelPass.renderToScreen = !isDrawEnabled
        this.drawPass.enabled = isDrawEnabled
        this.drawPass.renderToScreen = isDrawEnabled
    }
}

export { EffectComposer }
