import { Color } from 'three'

const DRAW_DEFAULTS = {
    thickness: 0.6,
    size: [1, 1],
    noisiness: 0.002,
    scale: 2,
    fillColor: 0,
    usePaperTexture: true,
    useNoiseTexture: true,
    useSketchTexture: true,
    showHatch: true,
    time: 0,
}

const DRAW_TEXTURE_PATHS = {
    noise: '/assets/textures/noise/noise.png',
    sketch: '/assets/textures/paper/sketch.jpg',
    paper: '/assets/textures/paper/Craft_Light.jpg',
}

function createDefaultInkColor() {
    return new Color(0.3725, 0.1255, 0.0392)
}

function colorToHex(color) {
    return `#${color.getHexString()}`
}

export { DRAW_DEFAULTS, DRAW_TEXTURE_PATHS, createDefaultInkColor, colorToHex }
