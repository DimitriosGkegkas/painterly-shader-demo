import { Effect } from 'postprocessing'
import { Color, RepeatWrapping, TextureLoader, Uniform } from 'three'
import fragmentShader from './postFragmentShader'


class DrawEffect extends Effect {
  constructor() {
    const noiseTexture = new TextureLoader().load('/assets/noise.png')
    noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping

    const noiseTexture2 = new TextureLoader().load('/assets/sketch.jpg')
    noiseTexture2.wrapS = noiseTexture2.wrapT = RepeatWrapping

    const paperTexture = new TextureLoader().load('/assets/Craft_Light.jpg')
    paperTexture.wrapS = paperTexture.wrapT = RepeatWrapping

    super('DrawEffect', fragmentShader, {
      uniforms: new Map([
        ['thickness', new Uniform(0.6)],
        ['size', new Uniform([1, 1])],
        ['noisiness', new Uniform(0.002)],
        ['inkColor', new Uniform(new Color(48 / 255, 32 / 255, 10 / 255))],
        ['scale', new Uniform(2)],
        ['normalBuffer', new Uniform(null)],
        ['paperTexture', new Uniform(paperTexture)],
        ['noiseTexture', new Uniform(noiseTexture)],
        ['boarderNoiseTexture', new Uniform(noiseTexture2)],
        ['usePaperTexture', new Uniform(true)],
        ['useNoiseTexture', new Uniform(true)],
        ['useSketchTexture', new Uniform(true)],
        ['iTime', new Uniform(0)],
        ['fillColor', new Uniform(0.0)],
        ['showHatch', new Uniform(true)],
        ['showEdge', new Uniform(true)],
        ['showColor', new Uniform(true)],
        ['selectedFBO', new Uniform(null)],
      ]),
    })

    this.needsDepthTexture = true
  }


  setOptions(options) {
    this.uniforms.get('useNoiseTexture').value = options.useNoiseTexture ?? true
    this.uniforms.get('useSketchTexture').value = options.useSketchTexture ?? true
    this.uniforms.get('usePaperTexture').value = options.usePaperTexture ?? true
  }

  update(_renderer, _inputBuffer, deltaTime) {
    this.uniforms.get('iTime').value += deltaTime
  }
}

export { DrawEffect }
