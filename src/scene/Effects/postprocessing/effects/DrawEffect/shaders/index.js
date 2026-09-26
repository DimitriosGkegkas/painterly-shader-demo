import color from './color.glsl'
import constants from './constants.glsl'
import main from './main.glsl'
import sobel from './sobel.glsl'

const fragmentShader = [constants, color, sobel, main].join('\n')

export default fragmentShader
