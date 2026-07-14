import { Color, MeshStandardMaterial } from 'three'

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
`

class CartoonBlobMaterial extends MeshStandardMaterial {
    constructor(options = {}) {
        super({
            color: options.color ?? new Color(0.55, 0.72, 1.0),
            roughness: options.roughness ?? 0.85,
            metalness: options.metalness ?? 0.05,
            ...options,
        })

        this.uniforms = {
            time: { value: 0 },
            blobAmount: { value: options.blobAmount ?? 0.22 },
            blobScale: { value: options.blobScale ?? 1.35 },
            blobSpeed: { value: options.blobSpeed ?? 0.55 },
            edgeColor: { value: options.edgeColor ?? new Color(0.02, 0.95, 0.82) },
            shadowColor: { value: options.shadowColor ?? new Color(0.08, 0.12, 0.22) },
            lightColor: { value: options.lightColor ?? new Color(0.62, 0.84, 1.0) },
            bandCount: { value: options.bandCount ?? 4 },
            edgeStart: { value: options.edgeStart ?? 0.28 },
            edgeEnd: { value: options.edgeEnd ?? 0.58 },
            edgeNoiseScale: { value: options.edgeNoiseScale ?? 1.15 },
            edgeNoiseStrength: { value: options.edgeNoiseStrength ?? 0.09 },
        }

        this.customProgramCacheKey = () => 'CartoonBlobMaterial_v1'

        this.onBeforeCompile = (shader) => {
            for (const uniformName of Object.keys(this.uniforms)) {
                shader.uniforms[uniformName] = this.uniforms[uniformName]
            }

            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
uniform float time;
uniform float blobAmount;
uniform float blobScale;
uniform float blobSpeed;
varying vec3 vBlobWorldPosition;
varying vec3 vBlobWorldNormal;
varying float vBlobNoise;
${noiseFunctions}`
            )

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
float blobNoise = fbm3(position * blobScale + vec3(time * blobSpeed, time * blobSpeed * 0.5, 0.0));
transformed += normal * ((blobNoise * 2.0 - 1.0) * blobAmount);
vBlobNoise = blobNoise;
vec4 blobWorldPosition = modelMatrix * vec4(transformed, 1.0);
vBlobWorldPosition = blobWorldPosition.xyz;
vBlobWorldNormal = normalize(mat3(modelMatrix) * normal);`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
uniform float time;
uniform vec3 edgeColor;
uniform vec3 shadowColor;
uniform vec3 lightColor;
uniform float bandCount;
uniform float edgeStart;
uniform float edgeEnd;
uniform float edgeNoiseScale;
uniform float edgeNoiseStrength;
varying vec3 vBlobWorldPosition;
varying vec3 vBlobWorldNormal;
varying float vBlobNoise;
${noiseFunctions}`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
vec3 viewDir = normalize(vViewPosition);
vec3 worldNormal = normalize(vBlobWorldNormal);
vec3 viewNormal = normalize(normal);
float rimBase = 1.0 - max(dot(viewNormal, viewDir), 0.0);
vec3 normalVariation = abs(dFdx(worldNormal)) + abs(dFdy(worldNormal));
float crease = smoothstep(0.18, 0.5, length(normalVariation) * 2.5);
float edgeNoise = (fbm3(vBlobWorldPosition * edgeNoiseScale + vec3(0.0, time * 0.3, time * 0.18)) * 2.0 - 1.0) * edgeNoiseStrength;
float rim = smoothstep(edgeStart + edgeNoise, edgeEnd + edgeNoise, rimBase);
float edgeMask = max(rim, crease * 0.45);

float levels = max(bandCount, 2.0);
vec3 lightDir = normalize(vec3(0.35, 0.82, 0.24));
float lightStrength = clamp(dot(worldNormal, lightDir) * 0.5 + 0.5, 0.0, 1.0);
float tone = floor(lightStrength * levels) / (levels - 1.0);
tone = clamp(tone, 0.0, 1.0);

float interiorNoise = mix(0.9, 1.08, fbm3(vBlobWorldPosition * 0.65 + vec3(time * 0.12)));
vec3 toonBase = mix(shadowColor, lightColor, tone);
toonBase = mix(toonBase, gl_FragColor.rgb, 0.25);
toonBase *= interiorNoise;
gl_FragColor.rgb = mix(toonBase, edgeColor, edgeMask);
gl_FragColor.rgb += (vBlobNoise - 0.5) * 0.04;`
            )
        }
    }
}

export { CartoonBlobMaterial }
