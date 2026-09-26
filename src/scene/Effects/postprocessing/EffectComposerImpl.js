import { SRGBColorSpace } from 'three'
import { EffectComposer as EffectComposerImpl, EffectPass, RenderPass, SMAAEffect, SMAAPreset, EdgeDetectionMode } from 'postprocessing'
import { ColorChannelEffect, DrawEffect } from './effects'
import { CHANNEL_MASKS } from './effects/ColorChannelEffect'

class EffectComposer extends EffectComposerImpl {
    constructor(renderer, options) {
        super(renderer, options)
        this.autoRenderToScreen = false
        this.colorChannel = 'all'

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
        this.colorChannel = CHANNEL_MASKS[channel] ? channel : 'all'
        this.colorChannelEffect.setChannel(this.colorChannel)
        this.drawEffect.uniforms.get('channelMask').value.fromArray(CHANNEL_MASKS[this.colorChannel])
        this.updateOutputPass()
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
        // DrawEffect applies the channel mask itself, including its neighbor samples.
        // Keep a final color-conversion pass when both effects are off: the custom
        // material writes linear data channels after Three's usual color conversion.
        this.colorChannelPass.enabled = !this.drawPass.enabled &&
            (this.colorChannel !== 'all' || !this.smaaPass.enabled)
        const enabledPasses = this.passes.filter((pass) => pass.enabled)
        const outputPass = enabledPasses[enabledPasses.length - 1]
        for (const pass of this.passes) {
            pass.renderToScreen = pass === outputPass
        }
    }
}

export { EffectComposer }
