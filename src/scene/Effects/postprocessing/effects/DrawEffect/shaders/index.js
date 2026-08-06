import color from './color.glsl'
import constants from './constants.glsl'
import hatch from './hatch.glsl'
import main from './main.glsl'
import math from './math.glsl'
import noise from './noise.glsl'
import sobel from './sobel.glsl'

const fragmentShader = [constants, color, math, noise, sobel, hatch, main].join('\n')

export default fragmentShader
