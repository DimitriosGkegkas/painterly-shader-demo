import {
    Color,
    MeshStandardMaterial,
    NoColorSpace,
    RepeatWrapping,
    TextureLoader,
    Vector3,
} from 'three'
import fragmentDebugBlock from './cartoonBlobFiberFragmentDebug.glsl'

const textureLoader = new TextureLoader()

// const fiberTexture = textureLoader.load('/assets/textures/noise/abstract-hand-drawn-texture-with-lines-template-design_124009-1716.jpg')
const fiberTexture = textureLoader.load('public/assets/textures/brush/Paint-Brush_normal.png')
fiberTexture.wrapS = fiberTexture.wrapT = RepeatWrapping
fiberTexture.colorSpace = NoColorSpace

const noiseFunctions = /* glsl */ `
float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

float noise3d(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);

    return mix(nxy0, nxy1, f.z);
}

float fbm3(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int i = 0; i < 4; i++) {
        value += amplitude * noise3d(p);
        p *= 2.02;
        amplitude *= 0.5;
    }

    return value;
}

vec3 triplanarWeights(vec3 normal) {
    vec3 weights = pow(abs(normal), vec3(4.0));
    return weights / max(weights.x + weights.y + weights.z, 0.0001);
}

vec2 rotate2d(vec2 point, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c) * point;
}

vec3 sampleTexture2DRotated(sampler2D map, vec2 uv, float textureScale, float rotation) {
    vec2 scaledUv = (uv - 0.5) * textureScale;
    vec2 rotatedUv = rotate2d(scaledUv, rotation) + 0.5;
    return texture(map, rotatedUv).rgb;
}

float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 buildStaticCameraForward(vec3 staticCameraPosition, vec3 staticCameraTarget) {
    return normalize(staticCameraTarget - staticCameraPosition);
}

vec3 buildStaticCameraRight(vec3 forward, vec3 up) {
    vec3 right = cross(forward, normalize(up));

    if (dot(right, right) < 0.0001) {
        right = cross(forward, vec3(0.0, 1.0, 0.0));
    }

    if (dot(right, right) < 0.0001) {
        right = cross(forward, vec3(1.0, 0.0, 0.0));
    }

    return normalize(right);
}

vec3 worldToStaticView(vec3 worldVector, vec3 staticCameraPosition, vec3 staticCameraTarget, vec3 staticCameraUp) {
    vec3 forward = buildStaticCameraForward(staticCameraPosition, staticCameraTarget);
    vec3 right = buildStaticCameraRight(forward, staticCameraUp);
    vec3 up = normalize(cross(right, forward));

    return vec3(
        dot(worldVector, right),
        dot(worldVector, up),
        dot(worldVector, -forward)
    );
}
`

const toVector3 = (value, fallback) => {
    if (value instanceof Vector3) {
        return value.clone()
    }

    if (Array.isArray(value)) {
        return new Vector3(value[0] ?? fallback.x, value[1] ?? fallback.y, value[2] ?? fallback.z)
    }

    return fallback.clone()
}

class CartoonBlobFiberStaticMaterial extends MeshStandardMaterial {
    constructor(options = {}) {
        const inkColor = options.inkColor ?? new Color(0.08, 0.12, 0.22)
        const outlineColor = options.outlineColor ?? new Color(0.02, 0.95, 0.82)
        const backgroundColor = options.backgroundColor ?? new Color(0.97, 0.96, 0.93)
        const roughness = options.roughness ?? 0.85
        const metalness = options.metalness ?? 0.05
        const edgeStart = options.edgeStart ?? 0.28
        const edgeEnd = options.edgeEnd ?? 0.58
        const edgeNoiseScale = options.edgeNoiseScale ?? 1.15
        const edgeNoiseStrength = options.edgeNoiseStrength ?? 0.09
        const customFiberTexture = options.fiberTexture ?? fiberTexture
        const fiberScale = options.fiberScale ?? 0.1
        const fiberInfluence = options.fiberInfluence ?? 1
        const fiberOffset = options.fiberOffset ?? 0.12
        const fiberRotationStep = options.fiberRotationStep ?? 0.35
        const fiberThreshold = options.fiberThreshold ?? 0.3
        const shadowStrength = options.shadowStrength ?? 0.85
        const staticCameraPosition = toVector3(options.staticCameraPosition, new Vector3(0, 0, 10))
        const staticCameraTarget = toVector3(options.staticCameraTarget, new Vector3(0, 0, 0))
        const staticCameraUp = toVector3(options.staticCameraUp, new Vector3(0, 1, 0))
        const worldZStart = options.worldZStart ?? 0
        const worldZEnd = options.worldZEnd ?? 10
        const materialOptions = { ...options }

        delete materialOptions.inkColor
        delete materialOptions.outlineColor
        delete materialOptions.backgroundColor
        delete materialOptions.edgeStart
        delete materialOptions.edgeEnd
        delete materialOptions.edgeNoiseScale
        delete materialOptions.edgeNoiseStrength
        delete materialOptions.fiberTexture
        delete materialOptions.fiberScale
        delete materialOptions.fiberInfluence
        delete materialOptions.fiberOffset
        delete materialOptions.fiberRotationStep
        delete materialOptions.fiberThreshold
        delete materialOptions.shadowStrength
        delete materialOptions.staticCameraPosition
        delete materialOptions.staticCameraTarget
        delete materialOptions.staticCameraUp
        delete materialOptions.worldZStart
        delete materialOptions.worldZEnd

        super({
            ...materialOptions,
            color: backgroundColor,
            roughness,
            metalness,
        })

        this.uniforms = {
            time: { value: 0 },
            inkColor: { value: inkColor },
            outlineColor: { value: outlineColor },
            backgroundColor: { value: backgroundColor },
            edgeStart: { value: edgeStart },
            edgeEnd: { value: edgeEnd },
            edgeNoiseScale: { value: edgeNoiseScale },
            edgeNoiseStrength: { value: edgeNoiseStrength },
            fiberTexture: { value: customFiberTexture },
            fiberScale: { value: fiberScale },
            fiberInfluence: { value: fiberInfluence },
            fiberOffset: { value: fiberOffset },
            fiberRotationStep: { value: fiberRotationStep },
            fiberThreshold: { value: fiberThreshold },
            shadowStrength: { value: shadowStrength },
            staticCameraPosition: { value: staticCameraPosition },
            staticCameraTarget: { value: staticCameraTarget },
            staticCameraUp: { value: staticCameraUp },
            worldZStart: { value: worldZStart },
            worldZEnd: { value: worldZEnd },
        }

        this.customProgramCacheKey = () => 'CartoonBlobFiberStaticMaterial_v1'

        this.onBeforeCompile = (shader) => {
            for (const uniformName of Object.keys(this.uniforms)) {
                shader.uniforms[uniformName] = this.uniforms[uniformName]
            }

            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vSurfaceUv;`
            )

            shader.vertexShader = shader.vertexShader.replace(
                '#include <defaultnormal_vertex>',
                `#include <defaultnormal_vertex>
vWorldNormal = normalize(inverseTransformDirection(transformedNormal, viewMatrix));`
            )

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
vec4 customWorldPosition = modelMatrix * vec4(transformed, 1.0);
vWorldPosition = customWorldPosition.xyz;
vSurfaceUv = uv;`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
uniform float time;
uniform vec3 inkColor;
uniform vec3 outlineColor;
uniform vec3 backgroundColor;
uniform float edgeStart;
uniform float edgeEnd;
uniform float edgeNoiseScale;
uniform float edgeNoiseStrength;
uniform sampler2D fiberTexture;
uniform float fiberScale;
uniform float fiberInfluence;
uniform float fiberOffset;
uniform float fiberRotationStep;
uniform float fiberThreshold;
uniform float shadowStrength;
uniform vec3 staticCameraPosition;
uniform vec3 staticCameraTarget;
uniform vec3 staticCameraUp;
uniform float worldZStart;
uniform float worldZEnd;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vSurfaceUv;
${noiseFunctions}`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <opaque_fragment>',
                `vec3 materialLitResult = outgoingLight;
#include <opaque_fragment>`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                fragmentDebugBlock
            )
        }
    }
}

export { CartoonBlobFiberStaticMaterial }
