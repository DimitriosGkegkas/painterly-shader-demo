import { Effect, EffectAttribute } from 'postprocessing'
import { Color, RepeatWrapping, TextureLoader, Uniform } from 'three'

const colorToHex = (color) => `#${color.getHexString()}`

const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D paperTexture;
uniform sampler2D noiseTexture;
uniform sampler2D sketchTexture;
uniform vec3 inkColor;
uniform float scale;
uniform float thickness;
uniform float contour;
uniform float noisiness;
uniform bool usePaperTexture;
uniform bool useNoiseTexture;
uniform bool useSketchTexture;

#define TAU 6.28318530718

float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

float aastep(float threshold, float value) {
    #ifdef GL_OES_standard_derivatives
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678;
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
    #else
    return step(threshold, value);
    #endif
}

vec2 rotate2d(vec2 value, float radians) {
    float s = sin(radians);
    float c = cos(radians);
    return mat2(c, -s, s, c) * value;
}

vec3 blendDarken(vec3 baseColor, vec3 blendColor, float opacity) {
    return mix(baseColor, min(baseColor, blendColor), clamp(opacity, 0.0, 1.0));
}

float linearDepthSample(vec2 uv) {
    float rawDepth = readDepth(uv);
    if (rawDepth >= 1.0) {
        return 1.0;
    }

    float viewDepth = -getViewZ(rawDepth);
    return clamp(viewDepth / cameraFar, 0.0, 1.0);
}

float depthEdge(vec2 uv, vec2 texel) {
    float tl = linearDepthSample(uv + vec2(-texel.x, -texel.y));
    float tc = linearDepthSample(uv + vec2(0.0, -texel.y));
    float tr = linearDepthSample(uv + vec2(texel.x, -texel.y));
    float ml = linearDepthSample(uv + vec2(-texel.x, 0.0));
    float mr = linearDepthSample(uv + vec2(texel.x, 0.0));
    float bl = linearDepthSample(uv + vec2(-texel.x, texel.y));
    float bc = linearDepthSample(uv + vec2(0.0, texel.y));
    float br = linearDepthSample(uv + vec2(texel.x, texel.y));

    float sobelX = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
    float sobelY = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
    return length(vec2(sobelX, sobelY));
}

vec2 getNoiseOffset(vec2 uv, float lineScale) {
    if (!useNoiseTexture) {
        return vec2(0.0);
    }

    vec2 sampleUv = uv * lineScale;
    vec2 noiseSample = texture(noiseTexture, sampleUv).rg * 2.0 - 1.0;
    return noiseSample * noisiness;
}

float linePattern(vec2 uv, vec2 resolution, float angle, float spacing, float weight) {
    vec2 rotatedUv = rotate2d((uv - 0.5) * resolution, angle);
    float dist = abs(mod(rotatedUv.y, spacing) - 0.5 * spacing);
    return 1.0 - aastep(weight, dist);
}

float hatchLayer(vec2 uv, vec2 resolution, float tone, float angle, float spacing, float weight, float sketchSeed) {
    float lines = linePattern(uv, resolution, angle, spacing, weight);
    if (!useSketchTexture) {
        return lines;
    }

    vec2 sketchUv = uv * 2.5 + vec2(sketchSeed, 0.0);
    float sketch = texture(sketchTexture, sketchUv).r;
    sketch = smoothstep(0.15, 0.85, sketch);
    return lines * sketch;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    vec2 resolution = vec2(textureSize(inputBuffer, 0));
    vec2 texel = max(vec2(thickness) / resolution, vec2(0.0001));
    float centerDepth = linearDepthSample(uv);
    float tone = clamp(luma(inputColor.rgb), 0.0, 1.0);
    vec2 offsetUv = uv + getNoiseOffset(uv, scale);
    float edge = depthEdge(offsetUv, texel * contour);

    edge *= 1.0 - aastep(0.9995, centerDepth);
    edge = aastep(0.0025, edge * 2.4);

    float hatch = 0.0;
    float lineWeight = mix(0.65, 1.45, 1.0 - tone);

    if (tone < 0.92) {
        hatch += hatchLayer(offsetUv, resolution, tone, 0.35 * TAU, scale * 18.0, lineWeight, 0.0);
    }

    if (tone < 0.68) {
        hatch += hatchLayer(offsetUv, resolution, tone, 0.62 * TAU, scale * 14.0, lineWeight * 0.95, 0.17);
    }

    if (tone < 0.42) {
        hatch += hatchLayer(offsetUv, resolution, tone, 0.12 * TAU, scale * 10.0, lineWeight * 0.85, 0.33);
    }

    hatch = clamp(hatch / 3.0, 0.0, 1.0) * (1.0 - tone);

    vec3 base = vec3(1.0);
    if (usePaperTexture) {
        base = texture(paperTexture, uv * resolution * 0.00025).rgb;
    }

    vec3 ink = inkColor;
    float toneWash = 1.0 - smoothstep(0.1, 0.95, tone);
    outputColor.rgb = blendDarken(base, mix(base, inputColor.rgb, 0.12), toneWash * 0.3);
    outputColor.rgb = blendDarken(outputColor.rgb, ink, hatch);
    outputColor.rgb = blendDarken(outputColor.rgb, ink, edge);
    outputColor.a = inputColor.a;
}
`

class PencilLinesEffect extends Effect {
    constructor() {
        const textureLoader = new TextureLoader()

        const noiseTexture = textureLoader.load('/assets/noise.png')
        noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping

        const sketchTexture = textureLoader.load('/assets/sketch.jpg')
        sketchTexture.wrapS = sketchTexture.wrapT = RepeatWrapping

        const paperTexture = textureLoader.load('/assets/Craft_Light.jpg')
        paperTexture.wrapS = paperTexture.wrapT = RepeatWrapping

        super('PencilLinesEffect', fragmentShader, {
            attributes: EffectAttribute.DEPTH,
            uniforms: new Map([
                ['paperTexture', new Uniform(paperTexture)],
                ['noiseTexture', new Uniform(noiseTexture)],
                ['sketchTexture', new Uniform(sketchTexture)],
                ['inkColor', new Uniform(new Color(60 / 255, 56 / 255, 50 / 255))],
                ['scale', new Uniform(0.55)],
                ['thickness', new Uniform(1.1)],
                ['contour', new Uniform(1.8)],
                ['noisiness', new Uniform(0.004)],
                ['usePaperTexture', new Uniform(true)],
                ['useNoiseTexture', new Uniform(true)],
                ['useSketchTexture', new Uniform(true)],
            ]),
        })
    }

    setOptions(options) {
        this.setParams(options)
    }

    setParams(params = {}) {
        if (params.scale !== undefined) this.uniforms.get('scale').value = params.scale
        if (params.thickness !== undefined) this.uniforms.get('thickness').value = params.thickness
        if (params.contour !== undefined) this.uniforms.get('contour').value = params.contour
        if (params.noisiness !== undefined) this.uniforms.get('noisiness').value = params.noisiness
        if (params.useNoiseTexture !== undefined) this.uniforms.get('useNoiseTexture').value = params.useNoiseTexture
        if (params.useSketchTexture !== undefined) this.uniforms.get('useSketchTexture').value = params.useSketchTexture
        if (params.usePaperTexture !== undefined) this.uniforms.get('usePaperTexture').value = params.usePaperTexture
        if (params.inkColor !== undefined) this.uniforms.get('inkColor').value.set(params.inkColor)
    }

    getParams() {
        return {
            scale: this.uniforms.get('scale').value,
            thickness: this.uniforms.get('thickness').value,
            contour: this.uniforms.get('contour').value,
            noisiness: this.uniforms.get('noisiness').value,
            useNoiseTexture: this.uniforms.get('useNoiseTexture').value,
            useSketchTexture: this.uniforms.get('useSketchTexture').value,
            usePaperTexture: this.uniforms.get('usePaperTexture').value,
            inkColor: colorToHex(this.uniforms.get('inkColor').value),
        }
    }
}

export { PencilLinesEffect }
