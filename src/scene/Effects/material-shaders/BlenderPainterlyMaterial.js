import {
    Color,
    DoubleSide,
    MeshPhysicalMaterial,
    NoColorSpace,
    RepeatWrapping,
    TextureLoader,
} from 'three'

const textureLoader = new TextureLoader()

const defaultBrushTexture = textureLoader.load('/assets/textures/brush/Paint-Brush_normal.png')
defaultBrushTexture.wrapS = defaultBrushTexture.wrapT = RepeatWrapping
defaultBrushTexture.colorSpace = NoColorSpace

const shaderUtils = /* glsl */ `
float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
}

vec3 hash33(vec3 p) {
    float n = sin(dot(p, vec3(7.0, 157.0, 113.0)));
    return fract(vec3(2097152.0, 262144.0, 32768.0) * n);
}

float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    vec3 u = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(
            mix(hash13(i + vec3(0.0, 0.0, 0.0)), hash13(i + vec3(1.0, 0.0, 0.0)), u.x),
            mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), u.x),
            u.y
        ),
        mix(
            mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), u.x),
            mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), u.x),
            u.y
        ),
        u.z
    );
}

float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 4; i++) {
        value += amplitude * noise3(p);
        p *= 2.0;
        amplitude *= 0.5;
    }

    return value;
}

vec3 triplanarWeights(vec3 normal) {
    vec3 weights = pow(abs(normal), vec3(4.0));
    return weights / max(weights.x + weights.y + weights.z, 0.0001);
}

vec3 sampleBoxTexture(sampler2D map, vec3 position, vec3 normal, float textureScale) {
    vec3 weights = triplanarWeights(normal);
    vec3 sampleX = texture(map, position.yz * textureScale).rgb;
    vec3 sampleY = texture(map, position.xz * textureScale).rgb;
    vec3 sampleZ = texture(map, position.xy * textureScale).rgb;
    return sampleX * weights.x + sampleY * weights.y + sampleZ * weights.z;
}

vec3 linearLightBlend(vec3 baseValue, vec3 blendValue, float factor) {
    vec3 result = clamp(baseValue + 2.0 * blendValue - 1.0, 0.0, 1.0);
    return mix(baseValue, result, clamp(factor, 0.0, 1.0));
}

vec3 voronoiPosition(vec3 x) {
    vec3 cell = floor(x);
    vec3 cellUv = fract(x);
    float bestDistance = 8.0;
    vec3 bestPoint = vec3(0.0);

    for (int xi = -1; xi <= 1; xi++) {
        for (int yi = -1; yi <= 1; yi++) {
            for (int zi = -1; zi <= 1; zi++) {
                vec3 offset = vec3(float(xi), float(yi), float(zi));
                vec3 point = hash33(cell + offset);
                vec3 delta = offset + point - cellUv;
                float distanceToPoint = dot(delta, delta);

                if (distanceToPoint < bestDistance) {
                    bestDistance = distanceToPoint;
                    bestPoint = point + offset;
                }
            }
        }
    }

    return bestPoint;
}
`

class BlenderPainterlyMaterial extends MeshPhysicalMaterial {
    constructor(options = {}) {
        super({
            color: options.color ?? new Color(0.2917707562446594, 0.24620144069194794, 0.20507879555225372),
            roughness: options.roughness ?? 0.7636363506317139,
            metalness: options.metalness ?? 0,
            ior: options.ior ?? 1.45,
            side: options.side ?? DoubleSide,
            ...options,
        })

        this.uniforms = {
            brushTexture: { value: options.brushTexture ?? defaultBrushTexture },
            mappingScale: { value: options.mappingScale ?? 1 },
            noiseScale: { value: options.noiseScale ?? 5 },
            noiseBlendFactor: { value: options.noiseBlendFactor ?? 0.15 },
            brushBlendFactor: { value: options.brushBlendFactor ?? 0.15 },
            voronoiScale: { value: options.voronoiScale ?? 2 },
            normalMixFactor: { value: options.normalMixFactor ?? 0.22 },
            brushNormalStrength: { value: options.brushNormalStrength ?? 5 },
            detailNormalStrength: { value: options.detailNormalStrength ?? 0.35 },
        }

        this.customProgramCacheKey = () => 'BlenderPainterlyMaterial_v1'

        this.onBeforeCompile = (shader) => {
            for (const uniformName of Object.keys(this.uniforms)) {
                shader.uniforms[uniformName] = this.uniforms[uniformName]
            }

            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
varying vec3 vPainterlyLocalPosition;
varying vec3 vPainterlyLocalNormal;`
            )

            shader.vertexShader = shader.vertexShader.replace(
                '#include <beginnormal_vertex>',
                `#include <beginnormal_vertex>
vPainterlyLocalNormal = normalize(objectNormal);`
            )

            shader.vertexShader = shader.vertexShader.replace(
                '#include <project_vertex>',
                `#include <project_vertex>
vPainterlyLocalPosition = transformed;`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
uniform sampler2D brushTexture;
uniform float mappingScale;
uniform float noiseScale;
uniform float noiseBlendFactor;
uniform float brushBlendFactor;
uniform float voronoiScale;
uniform float normalMixFactor;
uniform float brushNormalStrength;
uniform float detailNormalStrength;
varying vec3 vPainterlyLocalPosition;
varying vec3 vPainterlyLocalNormal;
${shaderUtils}`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <normal_fragment_maps>',
                `#include <normal_fragment_maps>
vec3 painterlyLocalNormal = normalize(vPainterlyLocalNormal);
if (!gl_FrontFacing) {
    painterlyLocalNormal *= -1.0;
}

vec3 objectNormalColor = painterlyLocalNormal * 0.5 + 0.5;
float noiseValue = fbm(painterlyLocalNormal * noiseScale);
vec3 noiseMixed = linearLightBlend(objectNormalColor, vec3(noiseValue), noiseBlendFactor);

vec3 mappedObjectPosition = vPainterlyLocalPosition * mappingScale;
vec3 brushSample = sampleBoxTexture(brushTexture, mappedObjectPosition, painterlyLocalNormal, 1.0);
vec3 brushMixed = linearLightBlend(noiseMixed, brushSample, brushBlendFactor);

vec3 voronoiPoint = fract(voronoiPosition(brushMixed * voronoiScale));
vec3 voronoiNormal = normalize(vec3(voronoiPoint.xy * 2.0 - 1.0, max(voronoiPoint.z, 0.15)));

vec3 brushNormal = normalize(vec3((brushSample.rg * 2.0 - 1.0) * brushNormalStrength, 1.0));
vec3 detailNormal = normalize(mix(voronoiNormal, brushNormal, normalMixFactor));

normal = normalize(normal + vec3(detailNormal.xy * detailNormalStrength, detailNormal.z - 1.0));`
            )
        }
    }
}

export { BlenderPainterlyMaterial }
