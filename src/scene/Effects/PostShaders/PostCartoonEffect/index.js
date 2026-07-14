import { Effect } from 'postprocessing'
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
uniform float noisiness;
uniform float angle;
uniform bool usePaperTexture;
uniform bool useNoiseTexture;
uniform bool useSketchTexture;

#define TAU 6.28318530718
#define LEVELS 10

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

float sampleLuma(vec2 uv) {
    return luma(texture(inputBuffer, uv).rgb);
}

float quantizedStep(vec2 uv, float level) {
    float value = sampleLuma(uv);
    value = round(value * float(LEVELS)) / float(LEVELS);
    return value > level ? 1.0 : 0.0;
}

float findBorder(vec2 uv, vec2 resolution, float level) {
    vec2 pixel = max(vec2(thickness) / resolution, vec2(0.0001));

    float horizEdge = 0.0;
    horizEdge -= quantizedStep(uv + vec2(-pixel.x, -pixel.y), level) * 1.0;
    horizEdge -= quantizedStep(uv + vec2(-pixel.x, 0.0), level) * 2.0;
    horizEdge -= quantizedStep(uv + vec2(-pixel.x, pixel.y), level) * 1.0;
    horizEdge += quantizedStep(uv + vec2(pixel.x, -pixel.y), level) * 1.0;
    horizEdge += quantizedStep(uv + vec2(pixel.x, 0.0), level) * 2.0;
    horizEdge += quantizedStep(uv + vec2(pixel.x, pixel.y), level) * 1.0;

    float vertEdge = 0.0;
    vertEdge -= quantizedStep(uv + vec2(-pixel.x, -pixel.y), level) * 1.0;
    vertEdge -= quantizedStep(uv + vec2(0.0, -pixel.y), level) * 2.0;
    vertEdge -= quantizedStep(uv + vec2(pixel.x, -pixel.y), level) * 1.0;
    vertEdge += quantizedStep(uv + vec2(-pixel.x, pixel.y), level) * 1.0;
    vertEdge += quantizedStep(uv + vec2(0.0, pixel.y), level) * 2.0;
    vertEdge += quantizedStep(uv + vec2(pixel.x, pixel.y), level) * 1.0;

    return length(vec2(horizEdge, vertEdge));
}

vec2 getNoiseOffset(vec2 uv, float levelScale) {
    if (!useNoiseTexture) {
        return vec2(0.0);
    }

    vec2 scaledUv = uv * scale * levelScale;
    vec2 noiseSample = texture(noiseTexture, scaledUv).rg * 2.0 - 1.0;
    return noisiness * noiseSample;
}

float hatchPattern(vec2 uv, vec2 resolution, float tone, float levelIndex) {
    if (!useSketchTexture || tone >= 0.55) {
        return 0.0;
    }

    float hatchAngle = angle + mix(0.0, 3.2 * TAU, tone);
    vec2 rotatedUv = rotate2d((uv - 0.5) * resolution, hatchAngle);
    float spacing = mix(52.0, 220.0, clamp(tone * 2.0, 0.0, 1.0));
    float line = 1.0 - aastep(thickness * 1.25, abs(mod(rotatedUv.y + levelIndex * spacing / float(LEVELS), spacing)));

    vec2 sketchUv = uv * 3.0 + vec2(levelIndex * 0.03125, 0.0);
    float sketchMask = texture(sketchTexture, sketchUv).r;
    sketchMask = smoothstep(0.18, 0.9, sketchMask);

    return line * sketchMask;
}

vec3 blendDarken(vec3 baseColor, vec3 blendColor, float opacity) {
    return mix(baseColor, min(baseColor, blendColor), clamp(opacity, 0.0, 1.0));
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 resolution = vec2(textureSize(inputBuffer, 0));
    float edgeAcc = 0.0;
    float toneAcc = 0.0;
    float hatchAcc = 0.0;

    for (int i = 0; i < LEVELS; i++) {
        float level = float(i) / float(LEVELS);
        vec2 offsetUv = uv + getNoiseOffset(uv, mix(1.0, 4.0, level));
        vec3 colorSample = texture(inputBuffer, offsetUv).rgb;
        float tone = round(luma(colorSample) * float(LEVELS)) / float(LEVELS);

        edgeAcc += clamp(findBorder(offsetUv, resolution, level) - 5.0 * tone, 0.0, 1.0);
        toneAcc += tone / float(LEVELS);
        hatchAcc += hatchPattern(offsetUv, resolution, tone, float(i));
    }

    float tone = clamp(toneAcc * 2.0, 0.0, 1.0);
    float hatch = clamp(hatchAcc / 3.0, 0.0, 1.0);
    float edges = clamp(edgeAcc / 2.5, 0.0, 1.0);

    vec3 base = vec3(1.0);
    if (usePaperTexture) {
        base = texture(paperTexture, uv * resolution * 0.00025).rgb;
    }

    vec3 ink = inkColor;
    vec3 toonColor = mix(base, inputColor.rgb, 0.22);
    outputColor.rgb = blendDarken(base, toonColor, 1.0 - tone);
    outputColor.rgb = blendDarken(outputColor.rgb, ink, edges);
    outputColor.rgb = blendDarken(outputColor.rgb, ink, hatch);
    outputColor.a = inputColor.a;
}
`

class PostCartoonEffect extends Effect {
    constructor() {
        const textureLoader = new TextureLoader()

        const noiseTexture = textureLoader.load('/assets/noise.png')
        noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping

        const sketchTexture = textureLoader.load('/assets/sketch.jpg')
        sketchTexture.wrapS = sketchTexture.wrapT = RepeatWrapping

        const paperTexture = textureLoader.load('/assets/Craft_Light.jpg')
        paperTexture.wrapS = paperTexture.wrapT = RepeatWrapping

        super('PostCartoonEffect', fragmentShader, {
            uniforms: new Map([
                ['paperTexture', new Uniform(paperTexture)],
                ['noiseTexture', new Uniform(noiseTexture)],
                ['sketchTexture', new Uniform(sketchTexture)],
                ['inkColor', new Uniform(new Color(18 / 255, 119 / 255, 140 / 255))],
                ['scale', new Uniform(0.72)],
                ['thickness', new Uniform(0.7)],
                ['noisiness', new Uniform(0.007)],
                ['angle', new Uniform(0.0)],
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
        if (params.noisiness !== undefined) this.uniforms.get('noisiness').value = params.noisiness
        if (params.angle !== undefined) this.uniforms.get('angle').value = params.angle
        if (params.useNoiseTexture !== undefined) this.uniforms.get('useNoiseTexture').value = params.useNoiseTexture
        if (params.useSketchTexture !== undefined) this.uniforms.get('useSketchTexture').value = params.useSketchTexture
        if (params.usePaperTexture !== undefined) this.uniforms.get('usePaperTexture').value = params.usePaperTexture
        if (params.inkColor !== undefined) this.uniforms.get('inkColor').value.set(params.inkColor)
    }

    getParams() {
        return {
            scale: this.uniforms.get('scale').value,
            thickness: this.uniforms.get('thickness').value,
            noisiness: this.uniforms.get('noisiness').value,
            angle: this.uniforms.get('angle').value,
            useNoiseTexture: this.uniforms.get('useNoiseTexture').value,
            useSketchTexture: this.uniforms.get('useSketchTexture').value,
            usePaperTexture: this.uniforms.get('usePaperTexture').value,
            inkColor: colorToHex(this.uniforms.get('inkColor').value),
        }
    }
}

export { PostCartoonEffect }
