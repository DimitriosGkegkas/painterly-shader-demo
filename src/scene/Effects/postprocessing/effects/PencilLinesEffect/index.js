import { Effect } from 'postprocessing'
import { Color, RepeatWrapping, TextureLoader, Uniform } from 'three'

const colorToHex = (color) => `#${color.getHexString()}`

const fragmentShader = /* glsl */ `
uniform sampler2D surfaceBuffer;
uniform sampler2D cloudTexture;
uniform sampler2D colorTexture;
uniform sampler2D fiberTexture;
uniform vec3 inkColor;
uniform float thickness;
uniform float contour;
uniform float scale;
uniform float noisiness;
uniform bool useNoiseTexture;
uniform bool useSketchTexture;
uniform bool usePaperTexture;

float valueAtPoint(sampler2D image, vec2 coord, vec2 texel, vec2 point) {
    vec3 luma = vec3(0.299, 0.587, 0.114);
    return dot(texture2D(image, coord + texel * point).xyz, luma);
}

vec2 getOffset(vec2 uv) {
    if (!useNoiseTexture) {
        return vec2(0.0);
    }

    vec2 noiseUv = uv * max(scale, 0.0001);
    vec2 cloud = texture2D(cloudTexture, noiseUv).rg * 2.0 - 1.0;
    return cloud * noisiness;
}

float diffuseValue(vec2 uv, vec2 texel, int x, int y) {
    return valueAtPoint(inputBuffer, uv + getOffset(uv), texel, vec2(float(x), float(y))) * 0.6;
}

float normalValue(vec2 uv, vec2 texel, int x, int y) {
    return valueAtPoint(surfaceBuffer, uv + getOffset(uv), texel, vec2(float(x), float(y))) * 0.3;
}

float getValue(vec2 uv, vec2 texel, int x, int y) {
    return diffuseValue(uv, texel, x, y) + normalValue(uv, texel, x, y);
}

float sobelFloat(vec2 uv, vec2 texel) {
    const mat3 Gx = mat3(-1.0, -2.0, -1.0, 0.0, 0.0, 0.0, 1.0, 2.0, 1.0);
    const mat3 Gy = mat3(-1.0, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0);

    float tx0y0 = getValue(uv, texel, -1, -1);
    float tx0y1 = getValue(uv, texel, -1, 0);
    float tx0y2 = getValue(uv, texel, -1, 1);
    float tx1y0 = getValue(uv, texel, 0, -1);
    float tx1y1 = getValue(uv, texel, 0, 0);
    float tx1y2 = getValue(uv, texel, 0, 1);
    float tx2y0 = getValue(uv, texel, 1, -1);
    float tx2y1 = getValue(uv, texel, 1, 0);
    float tx2y2 = getValue(uv, texel, 1, 1);

    float valueGx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
        Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
        Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;

    float valueGy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
        Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
        Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;

    return clamp((valueGx * valueGx) + (valueGy * valueGy), 0.0, 1.0);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 texel = vec2(max(thickness, 0.0001)) / resolution;
    float sobelValue = sobelFloat(uv, texel);
    sobelValue = smoothstep(0.01, 0.03, sobelValue * max(contour, 0.0001));
    float lineAlpha = sobelValue * 0.5;

    if (useSketchTexture) {
        vec2 fiberUv = uv * resolution / 512.0 * max(scale, 0.0001) * vec2(0.65, 0.95);
        float fiber = texture2D(fiberTexture, fiberUv).r;
        fiber = smoothstep(0.2, 0.9, fiber);
        lineAlpha *= mix(0.82, 1.08, fiber);
    }

    vec3 lineColor = inkColor;
    if (usePaperTexture) {
        vec2 paperUv = uv * resolution / 512.0 * max(scale, 0.0001) * 0.35;
        float paper = texture2D(colorTexture, paperUv).r;
        lineColor *= mix(0.92, 1.04, paper);
    }

    lineAlpha = clamp(lineAlpha, 0.0, 1.0);
    outputColor = vec4(mix(inputColor.rgb, lineColor, lineAlpha), inputColor.a);
}
`

class PencilLinesEffect extends Effect {
    constructor() {
        const textureLoader = new TextureLoader()
        const cloudTexture = textureLoader.load('/assets/textures/noise/cloud-noise.png')
        cloudTexture.wrapS = cloudTexture.wrapT = RepeatWrapping
        const colorTexture = textureLoader.load('/assets/textures/noise/color-noise.png')
        colorTexture.wrapS = colorTexture.wrapT = RepeatWrapping
        const fiberTexture = textureLoader.load('/assets/textures/noise/fiber-noise.png')
        fiberTexture.wrapS = fiberTexture.wrapT = RepeatWrapping

        super('PencilLinesEffect', fragmentShader, {
            uniforms: new Map([
                ['surfaceBuffer', new Uniform(null)],
                ['cloudTexture', new Uniform(cloudTexture)],
                ['colorTexture', new Uniform(colorTexture)],
                ['fiberTexture', new Uniform(fiberTexture)],
                ['inkColor', new Uniform(new Color(0.32, 0.12, 0.2))],
                ['thickness', new Uniform(1)],
                ['contour', new Uniform(1)],
                ['scale', new Uniform(0.55)],
                ['noisiness', new Uniform(0.004)],
                ['useNoiseTexture', new Uniform(true)],
                ['useSketchTexture', new Uniform(true)],
                ['usePaperTexture', new Uniform(true)],
            ]),
        })
    }

    setSurfaceBuffer(texture) {
        this.uniforms.get('surfaceBuffer').value = texture
    }

    setOptions(options) {
        this.setParams(options)
    }

    setParams(params = {}) {
        if (params.thickness !== undefined) this.uniforms.get('thickness').value = params.thickness
        if (params.contour !== undefined) this.uniforms.get('contour').value = params.contour
        if (params.scale !== undefined) this.uniforms.get('scale').value = params.scale
        if (params.noisiness !== undefined) this.uniforms.get('noisiness').value = params.noisiness
        if (params.useNoiseTexture !== undefined) this.uniforms.get('useNoiseTexture').value = params.useNoiseTexture
        if (params.useSketchTexture !== undefined) this.uniforms.get('useSketchTexture').value = params.useSketchTexture
        if (params.usePaperTexture !== undefined) this.uniforms.get('usePaperTexture').value = params.usePaperTexture
        if (params.inkColor !== undefined) this.uniforms.get('inkColor').value.set(params.inkColor)
    }

    getParams() {
        return {
            thickness: this.uniforms.get('thickness').value,
            contour: this.uniforms.get('contour').value,
            scale: this.uniforms.get('scale').value,
            noisiness: this.uniforms.get('noisiness').value,
            useNoiseTexture: this.uniforms.get('useNoiseTexture').value,
            useSketchTexture: this.uniforms.get('useSketchTexture').value,
            usePaperTexture: this.uniforms.get('usePaperTexture').value,
            inkColor: colorToHex(this.uniforms.get('inkColor').value),
        }
    }
}

export { PencilLinesEffect }
