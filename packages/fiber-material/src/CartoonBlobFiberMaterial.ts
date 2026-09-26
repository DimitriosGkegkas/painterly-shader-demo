import {
    Color,
    DataTexture,
    MeshStandardMaterial,
    Matrix3,
    NoColorSpace,
    PerspectiveCamera,
    RGBAFormat,
    RepeatWrapping,
    UnsignedByteType,
    Vector3,
} from 'three'
import type { MeshStandardMaterialParameters, Texture, IUniform } from 'three'
import fragmentDebugBlock from './fiber.glsl?raw'

export type Vector3Input = Vector3 | [number, number, number]

export interface FiberMaterialParams {
    backgroundLight?: number
    edgeSmoothness?: number
    edgeOffset?: number
    fiberScale?: number
    noiseScale?: number
    bandCount?: number
    bandSoftness?: number
    bandTextureInfluence?: number
    useStaticCamera?: boolean
    disableEdgeNormals?: boolean
    /** Caller-owned data textures (NoColorSpace); null restores a neutral fallback. */
    fiberTexture?: Texture | null
    noiseTexture?: Texture | null
    shadowTexture?: Texture | null
    staticCameraPosition?: Vector3Input
    staticCameraTarget?: Vector3Input
    staticCameraUp?: Vector3Input
    /** Updated from the rendering camera before each draw. */
    cameraNear?: number
    cameraFar?: number
}

export type FiberMaterialOptions = Omit<MeshStandardMaterialParameters, 'color'> & FiberMaterialParams

type FiberUniforms = {
    [K in Exclude<keyof FiberMaterialParams, 'backgroundLight'>]-?: IUniform<
        K extends 'staticCameraPosition' | 'staticCameraTarget' | 'staticCameraUp'
            ? Vector3
            : K extends 'fiberTexture' | 'noiseTexture' | 'shadowTexture'
              ? Texture
              : NonNullable<FiberMaterialParams[K]>
    >
} & { staticViewMatrix: IUniform<Matrix3> }

const shaderHelpers = /* glsl */ `
float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}
`

const toVector3 = (value: Vector3Input | undefined, fallback: Vector3): Vector3 => {
    if (value instanceof Vector3) {
        return value.clone()
    }

    if (Array.isArray(value)) {
        return new Vector3(value[0] ?? fallback.x, value[1] ?? fallback.y, value[2] ?? fallback.z)
    }

    return fallback.clone()
}

class CartoonBlobFiberMaterial extends MeshStandardMaterial {
    readonly uniforms: FiberUniforms
    private readonly fallbackTextures = new Map<string, Texture>()
    private readonly _staticPosition = new Vector3(Infinity, Infinity, Infinity)
    private readonly _staticTarget = new Vector3(Infinity, Infinity, Infinity)
    private readonly _staticUp = new Vector3(Infinity, Infinity, Infinity)
    private readonly _forward = new Vector3()
    private readonly _right = new Vector3()
    private readonly _up = new Vector3()

    constructor(options: FiberMaterialOptions = {}) {
        const backgroundLight = options.backgroundLight ?? 0.95
        const backgroundColor = new Color(backgroundLight, backgroundLight, backgroundLight)
        const roughness = options.roughness ?? 0.85
        const metalness = options.metalness ?? 0.05
        const edgeSmoothness = options.edgeSmoothness ?? 0.3
        const edgeOffset = options.edgeOffset ?? 0.42
        const fiberScale = options.fiberScale ?? 0.1
        const noiseScale = options.noiseScale ?? 1
        const bandCount = options.bandCount ?? 5
        const bandSoftness = options.bandSoftness ?? 0.12
        const bandTextureInfluence = options.bandTextureInfluence ?? 0.35
        const useStaticCamera = options.useStaticCamera ?? false
        const disableEdgeNormals = options.disableEdgeNormals ?? false
        const staticCameraPosition = toVector3(options.staticCameraPosition, new Vector3(0, 0, 10))
        const staticCameraTarget = toVector3(options.staticCameraTarget, new Vector3(0, 0, 0))
        const staticCameraUp = toVector3(options.staticCameraUp, new Vector3(0, 1, 0))
        const cameraNear = options.cameraNear ?? 0.1
        const cameraFar = options.cameraFar ?? 10
        const materialOptions = { ...options }

        delete materialOptions.backgroundLight
        delete materialOptions.edgeSmoothness
        delete materialOptions.edgeOffset
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
        delete materialOptions.cameraNear
        delete materialOptions.cameraFar

        super({
            ...materialOptions,
            color: backgroundColor,
            roughness,
            metalness,
        })

        this.uniforms = {
            staticViewMatrix: { value: new Matrix3() },
            edgeSmoothness: { value: edgeSmoothness },
            edgeOffset: { value: edgeOffset },
            fiberTexture: { value: this.resolveTexture('fiberTexture', options.fiberTexture) },
            noiseTexture: { value: this.resolveTexture('noiseTexture', options.noiseTexture) },
            fiberScale: { value: fiberScale },
            noiseScale: { value: noiseScale },
            bandCount: { value: bandCount },
            bandSoftness: { value: bandSoftness },
            bandTextureInfluence: { value: bandTextureInfluence },
            useStaticCamera: { value: useStaticCamera },
            disableEdgeNormals: { value: disableEdgeNormals },
            shadowTexture: { value: this.resolveTexture('shadowTexture', options.shadowTexture) },
            staticCameraPosition: { value: staticCameraPosition },
            staticCameraTarget: { value: staticCameraTarget },
            staticCameraUp: { value: staticCameraUp },
            cameraNear: { value: cameraNear },
            cameraFar: { value: cameraFar },
        }

        this.updateStaticViewMatrix()

        this.onBeforeRender = (_renderer, _scene, camera) => {
            if (this.uniforms.useStaticCamera.value) this.updateStaticViewMatrix()
            if (camera instanceof PerspectiveCamera) {
                this.uniforms.cameraNear.value = camera.near
                this.uniforms.cameraFar.value = camera.far
            } else if ('near' in camera && typeof camera.near === 'number' && 'far' in camera && typeof camera.far === 'number') {
                this.uniforms.cameraNear.value = camera.near
                this.uniforms.cameraFar.value = camera.far
            }
        }

        this.onBeforeCompile = shader => {
            for (const uniformName of Object.keys(this.uniforms) as (keyof FiberUniforms)[]) {
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

            shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', fragmentDebugBlock)
        }
    }

    /** Uniform-only edits preserve the compiled program. Standard material properties use setValues. */
    setParams(params: FiberMaterialParams = {}): void {
        if (params.backgroundLight !== undefined) {
            this.color.setRGB(params.backgroundLight, params.backgroundLight, params.backgroundLight)
        }
        for (const [name, value] of Object.entries(params)) {
            if (value === undefined || name === 'backgroundLight') continue
            if (name === 'fiberTexture' || name === 'noiseTexture' || name === 'shadowTexture') {
                this.uniforms[name].value = this.resolveTexture(name, value as Texture | null)
            } else if (name === 'staticCameraPosition' || name === 'staticCameraTarget' || name === 'staticCameraUp') {
                const vector = value as Vector3Input
                if (Array.isArray(vector)) this.uniforms[name].value.fromArray(vector)
                else this.uniforms[name].value.copy(vector)
            } else if (name in this.uniforms && name !== 'staticViewMatrix') {
                const uniform = this.uniforms[name as keyof FiberUniforms] as IUniform
                if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError(`${name} must be finite`)
                uniform.value = value
            }
        }
    }

    /** Snapshot with independent vectors; textures remain shared and caller-owned. */
    getParams(): FiberMaterialParams {
        const params: Record<string, unknown> = { backgroundLight: this.color.r }
        for (const [name, uniform] of Object.entries(this.uniforms)) {
            if (name === 'staticViewMatrix') continue
            const value = uniform.value
            params[name] = value instanceof Vector3 ? value.clone() : value === this.fallbackTextures.get(name) ? null : value
        }
        return params as FiberMaterialParams
    }

    copy(source: this): this {
        super.copy(source)
        this.setParams(source.getParams())
        this.updateStaticViewMatrix()
        return this
    }

    customProgramCacheKey(): string {
        // Include injected GLSL so edits cannot reuse a stale program after hot reload.
        return this.onBeforeCompile.toString() + fragmentDebugBlock + shaderHelpers
    }

    private resolveTexture(name: string, texture?: Texture | null): Texture {
        if (texture) return texture
        let fallback = this.fallbackTextures.get(name)
        if (!fallback) {
            // Neutral grain; white shadow leaves static-camera lighting unmodified.
            const value = name === 'shadowTexture' ? 255 : 128
            fallback = new DataTexture(new Uint8Array([value, value, value, 255]), 1, 1, RGBAFormat, UnsignedByteType)
            fallback.colorSpace = NoColorSpace
            fallback.wrapS = fallback.wrapT = RepeatWrapping
            fallback.needsUpdate = true
            this.fallbackTextures.set(name, fallback)
        }
        return fallback
    }

    dispose(): void {
        for (const texture of this.fallbackTextures.values()) texture.dispose()
        this.fallbackTextures.clear()
        super.dispose()
    }

    updateStaticViewMatrix(): void {
        const position = this.uniforms.staticCameraPosition.value
        const target = this.uniforms.staticCameraTarget.value
        const up = this.uniforms.staticCameraUp.value
        if (this._staticPosition.equals(position) && this._staticTarget.equals(target) && this._staticUp.equals(up)) return
        this._staticPosition.copy(position)
        this._staticTarget.copy(target)
        this._staticUp.copy(up)

        const forward = this._forward.subVectors(target, position)
        if (forward.lengthSq() === 0) forward.set(0, 0, -1)
        forward.normalize()
        const right = this._right.crossVectors(forward, this._up.copy(up).normalize())
        if (right.lengthSq() < 0.0001) right.crossVectors(forward, this._up.set(0, 1, 0))
        if (right.lengthSq() < 0.0001) right.crossVectors(forward, this._up.set(1, 0, 0))
        right.normalize()
        const cameraUp = this._up.crossVectors(right, forward).normalize()
        this.uniforms.staticViewMatrix.value.set(right.x, right.y, right.z, cameraUp.x, cameraUp.y, cameraUp.z, -forward.x, -forward.y, -forward.z)
    }
}

export { CartoonBlobFiberMaterial }
