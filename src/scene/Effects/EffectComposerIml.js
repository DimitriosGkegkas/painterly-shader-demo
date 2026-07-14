import { SRGBColorSpace } from 'three'
import { EffectComposer as EffectComposerImpl, EffectPass, RenderPass, SMAAEffect } from 'postprocessing'
import { DrawEffect } from './PostShaders/DrawEffect'
import { ColorChannelEffect } from './PostShaders/ColorChannelEffect'

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
    }

    setOptions(options) {
        this.drawEffect.setOptions(options)
    }

    setColorChannel(channel) {
        this.colorChannelEffect.setChannel(channel)
    }

    setEffectEnable(enabled) {
        if (enabled) {
            this.drawPass.enabled = true
            this.renderPass.renderToScreen = false
            this.drawPass.renderToScreen = true
            this.colorChannelPass.renderToScreen = false
        } else {
            this.drawPass.enabled = false
            this.renderPass.renderToScreen = false
            this.drawPass.renderToScreen = false
            this.colorChannelPass.renderToScreen = true
        }
    }
}

export { EffectComposer }
