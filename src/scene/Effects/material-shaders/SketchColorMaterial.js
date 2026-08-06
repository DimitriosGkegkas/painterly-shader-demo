import { Color, MeshStandardMaterial, RepeatWrapping, TextureLoader } from 'three'
import { assetUrl } from '../../../utils/assetUrl.js'

const textureLoader = new TextureLoader()

const sketchTexture = textureLoader.load(assetUrl('assets/textures/paper/sketch.jpg'))
sketchTexture.wrapS = sketchTexture.wrapT = RepeatWrapping

const shaderUtils = /* glsl */ `
float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 blendDarken(vec3 baseColor, vec3 blendColor, float opacity) {
    return mix(baseColor, min(baseColor, blendColor), clamp(opacity, 0.0, 1.0));
}

vec3 triplanarWeights(vec3 normal) {
    vec3 weights = pow(abs(normal), vec3(3.0));
    return weights / max(weights.x + weights.y + weights.z, 0.0001);
}

float sampleTriplanarLuma(sampler2D map, vec3 position, vec3 normal, float textureScale) {
    vec3 weights = triplanarWeights(normal);
    float sampleX = luma(texture(map, position.yz * textureScale + vec2(0.13, 0.07)).rgb);
    float sampleY = luma(texture(map, position.xz * textureScale + vec2(0.31, 0.19)).rgb);
    float sampleZ = luma(texture(map, position.xy * textureScale + vec2(0.47, 0.29)).rgb);
    return sampleX * weights.x + sampleY * weights.y + sampleZ * weights.z;
}
`

class SketchColorMaterial extends MeshStandardMaterial {
    constructor(options = {}) {
        super({
            vertexColors: true,
            roughness: options.roughness ?? 1,
            metalness: options.metalness ?? 0,
            side: options.side,
            ...options,
        })

        this.uniforms = {
            sketchTexture: { value: sketchTexture },
            sketchScale: { value: options.sketchScale ?? 18 },
            darkColor: { value: options.darkColor ?? new Color(0.12, 0.18, 0.36) },
            lightColor: { value: options.lightColor ?? new Color(0.74, 0.86, 1.0) },
            guideContrast: { value: options.guideContrast ?? 1.15 },
            strokeStrength: { value: options.strokeStrength ?? 0.42 },
        }

        this.customProgramCacheKey = () => 'SketchColorMaterial_v3'

        this.onBeforeCompile = (shader) => {
            for (const uniformName of Object.keys(this.uniforms)) {
                shader.uniforms[uniformName] = this.uniforms[uniformName]
            }

            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
varying vec3 vSketchWorldPosition;`
            )

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
vec4 sketchWorldPosition = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
sketchWorldPosition = instanceMatrix * sketchWorldPosition;
#endif
sketchWorldPosition = modelMatrix * sketchWorldPosition;
vSketchWorldPosition = sketchWorldPosition.xyz;`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
uniform sampler2D sketchTexture;
uniform float sketchScale;
uniform vec3 darkColor;
uniform vec3 lightColor;
uniform float guideContrast;
uniform float strokeStrength;
varying vec3 vSketchWorldPosition;
${shaderUtils}`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
vec3 sketchWorldNormal = normalize(cross(dFdx(vSketchWorldPosition), dFdy(vSketchWorldPosition)));
if (dot(sketchWorldNormal, cameraPosition - vSketchWorldPosition) < 0.0) {
    sketchWorldNormal *= -1.0;
}

float sketchA = sampleTriplanarLuma(sketchTexture, vSketchWorldPosition, sketchWorldNormal, sketchScale);
float sketchB = sampleTriplanarLuma(sketchTexture, vSketchWorldPosition + vec3(17.0, 3.0, 9.0), sketchWorldNormal, sketchScale * 1.85);
float guide = smoothstep(0.18, 0.82, mix(sketchA, sketchB, 0.35));
guide = clamp((guide - 0.5) * guideContrast + 0.5, 0.0, 1.0);
float strokeMask = 1.0 - smoothstep(0.18, 0.82, sketchA);

vec3 lightDir = normalize(vec3(0.35, 0.82, 0.24));
float light = clamp(dot(sketchWorldNormal, lightDir) * 0.5 + 0.5, 0.0, 1.0);
vec3 baseDark = darkColor * mix(0.72, 1.0, light);
vec3 baseLight = lightColor * mix(0.78, 1.04, light);
vec3 guidedColor = mix(baseDark, baseLight, guide);

vec3 normalVariation = abs(dFdx(sketchWorldNormal)) + abs(dFdy(sketchWorldNormal));
float edge = smoothstep(0.08, 0.32, length(normalVariation) * 1.8);

gl_FragColor.rgb = guidedColor;
gl_FragColor.rgb = blendDarken(gl_FragColor.rgb, darkColor * 0.75, strokeMask * strokeStrength);
gl_FragColor.rgb = blendDarken(gl_FragColor.rgb, darkColor * 0.55, edge * 0.35);`
            )
        }
    }
}

export { SketchColorMaterial }
