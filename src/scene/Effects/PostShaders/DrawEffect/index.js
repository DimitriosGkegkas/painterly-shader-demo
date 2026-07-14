import { Effect } from 'postprocessing'
import { Color, RepeatWrapping, TextureLoader, Uniform } from 'three'
import fragmentShader from './postFragmentShader'

const colorToHex = (color) => `#${color.getHexString()}`

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
    this.setParams(options)
  }

  setParams(params = {}) {
    if (params.thickness !== undefined) this.uniforms.get('thickness').value = params.thickness
    if (params.noisiness !== undefined) this.uniforms.get('noisiness').value = params.noisiness
    if (params.scale !== undefined) this.uniforms.get('scale').value = params.scale
    if (params.fillColor !== undefined) this.uniforms.get('fillColor').value = params.fillColor
    if (params.showHatch !== undefined) this.uniforms.get('showHatch').value = params.showHatch
    if (params.showEdge !== undefined) this.uniforms.get('showEdge').value = params.showEdge
    if (params.showColor !== undefined) this.uniforms.get('showColor').value = params.showColor
    if (params.useNoiseTexture !== undefined) this.uniforms.get('useNoiseTexture').value = params.useNoiseTexture
    if (params.useSketchTexture !== undefined) this.uniforms.get('useSketchTexture').value = params.useSketchTexture
    if (params.usePaperTexture !== undefined) this.uniforms.get('usePaperTexture').value = params.usePaperTexture
    if (params.inkColor !== undefined) this.uniforms.get('inkColor').value.set(params.inkColor)
  }

  getParams() {
    return {
      thickness: this.uniforms.get('thickness').value,
      noisiness: this.uniforms.get('noisiness').value,
      scale: this.uniforms.get('scale').value,
      fillColor: this.uniforms.get('fillColor').value,
      showHatch: this.uniforms.get('showHatch').value,
      showEdge: this.uniforms.get('showEdge').value,
      showColor: this.uniforms.get('showColor').value,
      useNoiseTexture: this.uniforms.get('useNoiseTexture').value,
      useSketchTexture: this.uniforms.get('useSketchTexture').value,
      usePaperTexture: this.uniforms.get('usePaperTexture').value,
      inkColor: colorToHex(this.uniforms.get('inkColor').value),
    }
  }

  update(_renderer, _inputBuffer, deltaTime) {
    this.uniforms.get('iTime').value += deltaTime
  }
}

export { DrawEffect }
