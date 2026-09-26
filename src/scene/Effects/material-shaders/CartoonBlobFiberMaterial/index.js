import {
    Color,
    DataTexture,
    MeshStandardMaterial,
    Matrix3,
    NoColorSpace,
    PerspectiveCamera,
    RGBAFormat,
    RepeatWrapping,
    TextureLoader,
    UnsignedByteType,
    Vector3,
} from 'three'
import fragmentDebugBlock from './cartoonBlobFiberFragmentDebug.glsl'
import { assetUrl } from '../../../../utils/assetUrl.js'

const textureLoader = new TextureLoader()

const fiberTexture = textureLoader.load(assetUrl('assets/textures/brush/height_map.png'))
fiberTexture.wrapS = fiberTexture.wrapT = RepeatWrapping
fiberTexture.colorSpace = NoColorSpace

const defaultNoiseTexture = textureLoader.load(assetUrl('assets/textures/noise/cloud-noise.png'))
defaultNoiseTexture.wrapS = defaultNoiseTexture.wrapT = RepeatWrapping
defaultNoiseTexture.colorSpace = NoColorSpace

const defaultShadowTexture = new DataTexture(
    new Uint8Array([0, 0, 0, 255]),
    1,
    1,
    RGBAFormat,
    UnsignedByteType
)
defaultShadowTexture.colorSpace = NoColorSpace
defaultShadowTexture.wrapS = defaultShadowTexture.wrapT = RepeatWrapping
defaultShadowTexture.needsUpdate = true

const shaderHelpers = /* glsl */ `
float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
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

class CartoonBlobFiberMaterial extends MeshStandardMaterial {
    constructor(options = {}) {
        const backgroundLight = options.backgroundLight ?? 0.95
        const backgroundColor = new Color(
            backgroundLight,
            backgroundLight,
            backgroundLight
        )
        const roughness = options.roughness ?? 0.85
        const metalness = options.metalness ?? 0.05
        const edgeSmoothness = options.edgeSmoothness ?? 0.3
        const edgeOffset = options.edgeOffset ?? 0.42
        const edgeNoiseScale = options.edgeNoiseScale ?? 1.15
        const edgeNoiseStrength = options.edgeNoiseStrength ?? 0.09
        const customFiberTexture = options.fiberTexture ?? fiberTexture
        const customNoiseTexture = options.noiseTexture ?? defaultNoiseTexture
        const fiberScale = options.fiberScale ?? 0.1
        const noiseScale = options.noiseScale ?? 1
        const bandCount = options.bandCount ?? 5
        const bandSoftness = options.bandSoftness ?? 0.12
        const bandTextureInfluence = options.bandTextureInfluence ?? 0.35
        const useStaticCamera = options.useStaticCamera ?? false
        const disableEdgeNormals = options.disableEdgeNormals ?? false
        const customShadowTexture = options.shadowTexture ?? defaultShadowTexture
        const staticCameraPosition = toVector3(options.staticCameraPosition, new Vector3(0, 0, 10))
        const staticCameraTarget = toVector3(options.staticCameraTarget, new Vector3(0, 0, 0))
        const staticCameraUp = toVector3(options.staticCameraUp, new Vector3(0, 1, 0))
        const worldZStart = options.worldZStart ?? 0
        const worldZEnd = options.worldZEnd ?? 10
        const cameraNear = options.cameraNear ?? 0.1
        const cameraFar = options.cameraFar ?? 10
        const materialOptions = { ...options }

        delete materialOptions.backgroundLight
        delete materialOptions.edgeSmoothness
        delete materialOptions.edgeOffset
        delete materialOptions.edgeNoiseScale
        delete materialOptions.edgeNoiseStrength
        delete materialOptions.fiberTexture
        delete materialOptions.noiseTexture
        delete materialOptions.fiberScale
        delete materialOptions.noiseScale
        delete materialOptions.bandCount
        delete materialOptions.bandSoftness
        delete materialOptions.bandTextureInfluence
        delete materialOptions.useStaticCamera
        delete materialOptions.disableEdgeNormals
        delete materialOptions.shadowTexture
        delete materialOptions.staticCameraPosition
        delete materialOptions.staticCameraTarget
        delete materialOptions.staticCameraUp
        delete materialOptions.worldZStart
        delete materialOptions.worldZEnd
        delete materialOptions.cameraNear
        delete materialOptions.cameraFar

        super({
            ...materialOptions,
            color: backgroundColor,
            roughness,
            metalness,
        })

        this.uniforms = {
            edgeSmoothness: { value: edgeSmoothness },
            edgeOffset: { value: edgeOffset },
            edgeNoiseScale: { value: edgeNoiseScale },
            edgeNoiseStrength: { value: edgeNoiseStrength },
            fiberTexture: { value: customFiberTexture },
            noiseTexture: { value: customNoiseTexture },
            fiberScale: { value: fiberScale },
            noiseScale: { value: noiseScale },
            bandCount: { value: bandCount },
            bandSoftness: { value: bandSoftness },
            bandTextureInfluence: { value: bandTextureInfluence },
            useStaticCamera: { value: useStaticCamera },
            disableEdgeNormals: { value: disableEdgeNormals },
            shadowTexture: { value: customShadowTexture },
            staticCameraPosition: { value: staticCameraPosition },
            staticCameraTarget: { value: staticCameraTarget },
            staticCameraUp: { value: staticCameraUp },
            worldZStart: { value: worldZStart },
            worldZEnd: { value: worldZEnd },
            cameraNear: { value: cameraNear },
            cameraFar: { value: cameraFar },
        }

        this.uniforms.staticViewMatrix = { value: new Matrix3() }
        this._staticPosition = new Vector3(Infinity, Infinity, Infinity)
        this._staticTarget = new Vector3(Infinity, Infinity, Infinity)
        this._staticUp = new Vector3(Infinity, Infinity, Infinity)
        this._forward = new Vector3()
        this._right = new Vector3()
        this._up = new Vector3()
        this.updateStaticViewMatrix()

        this.customProgramCacheKey = () => 'CartoonBlobFiberMaterial_v21'

        this.onBeforeRender = (_renderer, _scene, camera) => {
            if (this.uniforms.useStaticCamera.value) this.updateStaticViewMatrix()
            if (camera instanceof PerspectiveCamera) {
                this.uniforms.cameraNear.value = camera.near
                this.uniforms.cameraFar.value = camera.far
            } else if ('near' in camera && 'far' in camera) {
                this.uniforms.cameraNear.value = camera.near
                this.uniforms.cameraFar.value = camera.far
            }
        }

        this.onBeforeCompile = (shader) => {
            for (const uniformName of Object.keys(this.uniforms)) {
                shader.uniforms[uniformName] = this.uniforms[uniformName]
            }

            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
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
vSurfaceUv = uv;`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
uniform float edgeSmoothness;
uniform float edgeOffset;
uniform float edgeNoiseScale;
uniform float edgeNoiseStrength;
uniform sampler2D fiberTexture;
uniform sampler2D noiseTexture;
uniform float fiberScale;
uniform float noiseScale;
uniform float bandCount;
uniform float bandSoftness;
uniform float bandTextureInfluence;
uniform bool useStaticCamera;
uniform bool disableEdgeNormals;
uniform sampler2D shadowTexture;
uniform mat3 staticViewMatrix;
uniform float worldZStart;
uniform float worldZEnd;
uniform float cameraNear;
uniform float cameraFar;
varying vec3 vWorldNormal;
varying vec2 vSurfaceUv;
${shaderHelpers}`
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

    // Numeric controls only change existing uniform values; no material/program replacement.
    setParams(params = {}) {
        if (params.backgroundLight !== undefined) {
            this.color.setRGB(params.backgroundLight, params.backgroundLight, params.backgroundLight)
        }
        for (const [name, value] of Object.entries(params)) {
            const uniform = this.uniforms[name]
            if (!uniform || value === undefined) continue
            if (uniform.value instanceof Vector3) {
                if (Array.isArray(value)) uniform.value.fromArray(value)
                else uniform.value.copy(value)
            } else {
                uniform.value = value
            }
        }
    }

    updateStaticViewMatrix() {
        const position = this.uniforms.staticCameraPosition.value
        const target = this.uniforms.staticCameraTarget.value
        const up = this.uniforms.staticCameraUp.value
        if (this._staticPosition.equals(position) && this._staticTarget.equals(target) && this._staticUp.equals(up)) return
        this._staticPosition.copy(position)
        this._staticTarget.copy(target)
        this._staticUp.copy(up)

        const forward = this._forward.subVectors(target, position).normalize()
        const right = this._right.crossVectors(forward, this._up.copy(up).normalize())
        if (right.lengthSq() < 0.0001) right.crossVectors(forward, this._up.set(0, 1, 0))
        if (right.lengthSq() < 0.0001) right.crossVectors(forward, this._up.set(1, 0, 0))
        right.normalize()
        const cameraUp = this._up.crossVectors(right, forward).normalize()
        this.uniforms.staticViewMatrix.value.set(
            right.x, right.y, right.z,
            cameraUp.x, cameraUp.y, cameraUp.z,
            -forward.x, -forward.y, -forward.z
        )
    }
}

export { CartoonBlobFiberMaterial }
