# @dimitrisgkegkas/fiber-material

A configurable `MeshStandardMaterial` subclass that encodes depth/orientation, grain, and lighting for ink rendering. ESM and TypeScript types; no React, network image requests, or consumer GLSL plugin.

```sh
yarn add @dimitrisgkegkas/fiber-material three@0.174.0
```

```ts
import { NoColorSpace, RepeatWrapping, TextureLoader } from 'three'
import { CartoonBlobFiberMaterial } from '@dimitrisgkegkas/fiber-material'

const fiber = await new TextureLoader().loadAsync('/your-assets/fiber.png')
fiber.colorSpace = NoColorSpace
fiber.wrapS = fiber.wrapT = RepeatWrapping

const material = new CartoonBlobFiberMaterial({
    fiberTexture: fiber,
    backgroundLight: 0.2,
    edgeSmoothness: 0.1,
    edgeOffset: 0.5,
    bandCount: 5,
    bandSoftness: 0.12,
    bandTextureInfluence: 0.35,
    roughness: 0.85,
})
mesh.material = material
material.setParams({ bandCount: 8, fiberScale: 2 })
material.setValues({ roughness: 0.7 }) // standard Three.js properties
material.setParams({ fiberTexture: null }) // restore internal fallback
const snapshot = material.getParams()
const copy = material.clone() // independent uniforms and vectors

material.dispose() // releases only owned fallback textures
copy.dispose()
fiber.dispose() // supplied textures belong to the caller
```

## Configuration

| Parameter                 | Default     | Meaning                                              |
| ------------------------- | ----------- | ---------------------------------------------------- |
| `backgroundLight`         | `0.95`      | Linear grayscale base material color                 |
| `edgeSmoothness`          | `0.3`       | Width of silhouette transition, 0–1                  |
| `edgeOffset`              | `0.42`      | Position of full edge coverage, 0–1                  |
| `fiberScale`              | `0.1`       | Fiber UV scale                                       |
| `noiseScale`              | `1`         | Noise UV scale                                       |
| `bandCount`               | `5`         | Light bands; <= 1 disables banding                   |
| `bandSoftness`            | `0.12`      | Band transition softness                             |
| `bandTextureInfluence`    | `0.35`      | Fiber contribution to band transitions               |
| `useStaticCamera`         | `false`     | Use a fixed reference camera for surface orientation |
| `disableEdgeNormals`      | `false`     | Disable silhouette normal modulation                 |
| `staticCameraPosition`    | `[0,0,10]`  | Static reference position                            |
| `staticCameraTarget`      | `[0,0,0]`   | Static reference target                              |
| `staticCameraUp`          | `[0,1,0]`   | Static reference up vector                           |
| `cameraNear`, `cameraFar` | `0.1`, `10` | Replaced by the active camera planes before drawing  |

Vectors accept `Vector3` or a three-number tuple. `fiberTexture`, `noiseTexture`, and `shadowTexture` accept a `Texture` or `null`; configure data textures with `NoColorSpace` and your preferred wrapping/filtering. The material never mutates supplied texture settings or disposes supplied textures. Shared textures can be reused across any number of materials.

Missing fiber/noise textures use tiny, lazily created neutral gray textures; a missing shadow texture uses white, leaving lighting unmodified. `shadowTexture` is sampled in static-camera mode. Fallbacks are owned and disposed by each material. Clones share supplied textures but have separate fallbacks and uniforms. Snapshots copy vectors and retain references to supplied textures; fallback textures are represented as `null`.

All standard `MeshStandardMaterial` constructor options are accepted except `color`; use `backgroundLight` for the intended grayscale data pipeline. Roughness defaults to `0.85`, metalness to `0.05`. `setParams` changes shader controls without recompilation; use normal Three.js APIs for base material properties. Static-camera matrices are recalculated only when their vectors change. A coincident position/target uses a deterministic forward vector.

## Output contract

This material writes RGB **data after Three.js color conversion**, not final display color:

-   Red: normalized depth plus orientation signal, which can exceed 1.
-   Green: noise texture brightness used to modulate outlines.
-   Blue: banded lighting minus silhouette coverage, used for ink density.

Pair it with `DrawEffect` or `ShaderEffectComposer` from `@dimitrisgkegkas/postprocessing` for the final ink appearance. Use half-float render targets to preserve the data range. It also works with your own shader if that shader understands this encoding. UVs are required for texture sampling. The implementation targets WebGLRenderer and Three.js 0.174 shader chunks; WebGPU/TSL and materially different Three.js versions are not covered by this compatibility range.

Exports: `CartoonBlobFiberMaterial`, `fiberFragmentShader` (the injection snippet, not a standalone complete fragment shader), `FiberMaterialParams`, `FiberMaterialOptions`, and `Vector3Input`.

## Build and distribution

From the repository root: `yarn build:packages`, `yarn dev:packages`, `yarn test`, or `yarn pack:packages`. From this folder: `yarn build`, `yarn dev`, or `npm pack`. Publishing rebuilds via `prepack`. Three.js is an external peer dependency (`~0.174.0`). Published under the personal `@dimitrisgkegkas` npm scope. Current license: UNLICENSED.
