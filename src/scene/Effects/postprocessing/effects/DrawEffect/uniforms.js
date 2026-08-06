import { RepeatWrapping, TextureLoader, Uniform } from 'three'
import { DRAW_DEFAULTS, DRAW_TEXTURE_PATHS, createDefaultInkColor, colorToHex } from './defaults'

const textureLoader = new TextureLoader()

const PARAM_UNIFORM_KEYS = {
    thickness: 'thickness',
    noisiness: 'noisiness',
    scale: 'scale',
    fillColor: 'fillColor',
    showHatch: 'showHatch',
    useNoiseTexture: 'useNoiseTexture',
    useSketchTexture: 'useSketchTexture',
    usePaperTexture: 'usePaperTexture',
}

function loadRepeatingTexture(path) {
    const texture = textureLoader.load(path)
    texture.wrapS = texture.wrapT = RepeatWrapping
    return texture
}

function createDrawUniforms() {
    const noiseTexture = loadRepeatingTexture(DRAW_TEXTURE_PATHS.noise)
    const sketchTexture = loadRepeatingTexture(DRAW_TEXTURE_PATHS.sketch)
    const paperTexture = loadRepeatingTexture(DRAW_TEXTURE_PATHS.paper)

    return new Map([
        ['thickness', new Uniform(DRAW_DEFAULTS.thickness)],
        ['size', new Uniform(DRAW_DEFAULTS.size)],
        ['noisiness', new Uniform(DRAW_DEFAULTS.noisiness)],
        ['inkColor', new Uniform(createDefaultInkColor())],
        ['scale', new Uniform(DRAW_DEFAULTS.scale)],
        ['normalBuffer', new Uniform(null)],
        ['paperTexture', new Uniform(paperTexture)],
        ['noiseTexture', new Uniform(noiseTexture)],
        ['borderNoiseTexture', new Uniform(sketchTexture)],
        ['usePaperTexture', new Uniform(DRAW_DEFAULTS.usePaperTexture)],
        ['useNoiseTexture', new Uniform(DRAW_DEFAULTS.useNoiseTexture)],
        ['useSketchTexture', new Uniform(DRAW_DEFAULTS.useSketchTexture)],
        ['iTime', new Uniform(DRAW_DEFAULTS.time)],
        ['fillColor', new Uniform(DRAW_DEFAULTS.fillColor)],
        ['showHatch', new Uniform(DRAW_DEFAULTS.showHatch)],
        ['selectedFBO', new Uniform(null)],
    ])
}

function applyDrawParams(uniforms, params = {}) {
    for (const [paramKey, uniformKey] of Object.entries(PARAM_UNIFORM_KEYS)) {
        if (params[paramKey] !== undefined) {
            uniforms.get(uniformKey).value = params[paramKey]
        }
    }

    if (params.inkColor !== undefined) {
        uniforms.get('inkColor').value.set(params.inkColor)
    }
}

function readDrawParams(uniforms) {
    return {
        thickness: uniforms.get('thickness').value,
        noisiness: uniforms.get('noisiness').value,
        scale: uniforms.get('scale').value,
        fillColor: uniforms.get('fillColor').value,
        showHatch: uniforms.get('showHatch').value,
        useNoiseTexture: uniforms.get('useNoiseTexture').value,
        useSketchTexture: uniforms.get('useSketchTexture').value,
        usePaperTexture: uniforms.get('usePaperTexture').value,
        inkColor: colorToHex(uniforms.get('inkColor').value),
    }
}

function stepDrawTime(uniforms, deltaTime) {
    uniforms.get('iTime').value += deltaTime
}

export { applyDrawParams, createDrawUniforms, readDrawParams, stepDrawTime }
