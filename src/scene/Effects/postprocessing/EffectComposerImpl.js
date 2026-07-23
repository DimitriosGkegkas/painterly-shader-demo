import { SRGBColorSpace } from 'three'
import { EffectComposer as EffectComposerImpl, EffectPass, NormalPass, RenderPass, SMAAEffect } from 'postprocessing'
import { ColorChannelEffect, DrawEffect, PencilLinesEffect } from './effects'

class EffectComposer extends EffectComposerImpl {
    constructor(renderer, options) {
        super(renderer, options)

        this.renderPass = new RenderPass(this.scene, this.camera)

        this.smaaEffect = new SMAAEffect()
        this.smaaPass = new EffectPass(this.camera, this.smaaEffect)
        this.smaaEffect.samples = 4

        this.drawEffect = new DrawEffect()
        this.drawPass = new EffectPass(this.camera, this.drawEffect)

        this.pencilLinesEffect = new PencilLinesEffect()
        this.pencilLinesNormalPass = new NormalPass(this.scene, this.camera)
        this.pencilLinesEffect.setSurfaceBuffer(this.pencilLinesNormalPass.texture)
        this.pencilLinesPass = new EffectPass(this.camera, this.pencilLinesEffect)

        this.colorChannelEffect = new ColorChannelEffect()
        this.colorChannelPass = new EffectPass(this.camera, this.colorChannelEffect)

        this.addPass(this.renderPass)
        this.addPass(this.colorChannelPass)
        this.addPass(this.drawPass)
        this.addPass(this.pencilLinesNormalPass)
        this.addPass(this.pencilLinesPass)

        renderer.outputColorSpace = SRGBColorSpace
        this.smaaPass.outputColorSpace = 'srgb'

        this.setEffectMode('draw')
    }

    setOptions(options) {
        this.drawEffect.setOptions(options)
        this.pencilLinesEffect.setOptions(options)
    }

    getEffect(effectMode) {
        if (effectMode === 'draw') return this.drawEffect
        if (effectMode === 'pencilLines') return this.pencilLinesEffect
        return null
    }

    setEffectParams(effectMode, params) {
        const effect = this.getEffect(effectMode)
        effect?.setParams?.(params)
    }

    setColorChannel(channel) {
        this.colorChannelEffect.setChannel(channel)
    }

    setEffectMode(mode = 'draw') {
        const effectMode = mode ?? 'draw'
        const isDraw = effectMode === 'draw'
        const isPencilLines = effectMode === 'pencilLines'
        const hasStylizedEffect = isDraw || isPencilLines

        this.drawPass.enabled = isDraw
        this.pencilLinesNormalPass.enabled = isPencilLines
        this.pencilLinesPass.enabled = isPencilLines

        this.renderPass.renderToScreen = false
        this.colorChannelPass.renderToScreen = !hasStylizedEffect
        this.drawPass.renderToScreen = isDraw
        this.pencilLinesPass.renderToScreen = isPencilLines
    }
}

export { EffectComposer }
