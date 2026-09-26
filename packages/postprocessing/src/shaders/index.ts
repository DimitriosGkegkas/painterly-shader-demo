import color from './color.glsl?raw'
import sobel from './sobel.glsl?raw'
import main from './main.glsl?raw'

export const drawFragmentShader = [color, sobel, main].join('\n')
