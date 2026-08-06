import { Effect } from 'postprocessing'
import fragmentShader from './shaders'
import { applyDrawParams, createDrawUniforms, readDrawParams, stepDrawTime } from './uniforms'

class DrawEffect extends Effect {
  constructor() {
    super('DrawEffect', fragmentShader, {
      uniforms: createDrawUniforms(),
    })

    this.needsDepthTexture = true
  }

  setOptions(options) {
    this.setParams(options)
  }

  setParams(params = {}) {
    applyDrawParams(this.uniforms, params)
  }

  getParams() {
    return readDrawParams(this.uniforms)
  }

  update(_renderer, _inputBuffer, deltaTime) {
    stepDrawTime(this.uniforms, deltaTime)
  }
}

export { DrawEffect }
