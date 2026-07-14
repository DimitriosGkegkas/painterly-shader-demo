import { SRGBColorSpace } from 'three'
import { EffectComposer as EffectComposerImpl, EffectPass, RenderPass, SMAAEffect } from 'postprocessing'
import { ColorChannelEffect, DrawEffect, PencilLinesEffect, PostCartoonEffect } from './PostShaders'

class EffectComposer extends EffectComposerImpl {
    constructor(renderer, options) {
        super(renderer, options)

        this.renderPass = new RenderPass(this.scene, this.camera)

        this.smaaEffect = new SMAAEffect()
        this.smaaPass = new EffectPass(this.camera, this.smaaEffect)
        this.smaaEffect.samples = 4

        this.drawEffect = new DrawEffect()
        this.drawPass = new EffectPass(this.camera, this.drawEffect)

        this.postCartoonEffect = new PostCartoonEffect()
        this.postCartoonPass = new EffectPass(this.camera, this.postCartoonEffect)

        this.pencilLinesEffect = new PencilLinesEffect()
        this.pencilLinesPass = new EffectPass(this.camera, this.pencilLinesEffect)

        this.colorChannelEffect = new ColorChannelEffect()
        this.colorChannelPass = new EffectPass(this.camera, this.colorChannelEffect)

        this.addPass(this.renderPass)
        this.addPass(this.colorChannelPass)
        this.addPass(this.drawPass)
        this.addPass(this.postCartoonPass)
        this.addPass(this.pencilLinesPass)

        renderer.outputColorSpace = SRGBColorSpace
        this.smaaPass.outputColorSpace = 'srgb'

        this.setEffectMode('draw')
    }

    setOptions(options) {
        this.drawEffect.setOptions(options)
        this.postCartoonEffect.setOptions(options)
        this.pencilLinesEffect.setOptions(options)
    }

    getEffect(effectMode) {
        if (effectMode === 'draw') return this.drawEffect
        if (effectMode === 'cartoon') return this.postCartoonEffect
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
        const isCartoon = effectMode === 'cartoon'
        const isPencilLines = effectMode === 'pencilLines'
        const hasStylizedEffect = isDraw || isCartoon || isPencilLines

        this.drawPass.enabled = isDraw
        this.postCartoonPass.enabled = isCartoon
        this.pencilLinesPass.enabled = isPencilLines

        this.renderPass.renderToScreen = false
        this.colorChannelPass.renderToScreen = !hasStylizedEffect
        this.drawPass.renderToScreen = isDraw
        this.postCartoonPass.renderToScreen = isCartoon
        this.pencilLinesPass.renderToScreen = isPencilLines
    }
}

export { EffectComposer }
