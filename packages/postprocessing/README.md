# @dimitrisgkegkas/postprocessing

Ink wash postprocessing and a configurable Three.js composer. ESM with TypeScript types; no React, asset requests, or GLSL build plugin required.

```sh
yarn add @dimitrisgkegkas/postprocessing three@0.174.0 postprocessing@6.37.1
```

## Composer

```ts
import { SRGBColorSpace, RepeatWrapping, TextureLoader } from 'three'
import { ShaderEffectComposer } from '@dimitrisgkegkas/postprocessing'

renderer.outputColorSpace = SRGBColorSpace
const paper = await new TextureLoader().loadAsync('/your-assets/paper.jpg')
paper.colorSpace = SRGBColorSpace
paper.wrapS = paper.wrapT = RepeatWrapping

const composer = new ShaderEffectComposer(renderer, scene, camera, {
    paperTexture: paper, // optional; otherwise white paper
    draw: { appearance: 1, inkColor: '#82380d', edgeRadius: 0.5 },
    multisampling: 'auto', // low DPR: up to 8 samples; DPR >= 2: none
    antialiasing: true, // final SMAA pass, independent of MSAA
})
composer.setSize(width, height) // CSS pixels, after renderer.setPixelRatio(...)
composer.render(deltaSeconds) // call once per animation frame
composer.setDrawParams({ appearance: 0.5 })
composer.setColorChannel('redBlue')
composer.setAntialiasingEnabled(false)
composer.setDrawEffectEnabled(false)

// After replacing camera or scene:
composer.setMainCamera(nextCamera)
composer.setMainScene(nextScene)

// Cleanup: the composer owns its passes/effects, the application owns textures.
composer.dispose()
paper.dispose()
```

`EffectComposer` is an alias of `ShaderEffectComposer`. Constructor options also include `drawEnabled`, `colorChannel`, `smaaPreset`, `edgeDetectionMode`, `renderToScreen`, `frameBufferType`, `depthBuffer`, and `stencilBuffer`. Half-float buffers are the default because the material's red signal can exceed 1. The composer preserves caller renderer color-space settings; use sRGB output for display.

`setMultisampling(number | 'auto')` changes the sampling policy. On DPR changes, call `renderer.setPixelRatio(...)` then `composer.setSize(width, height)`; buffers change without replacing effects. `setRenderToScreen(false)` keeps output in `composer.inputBuffer.texture` after rendering. This texture is linear working-space data: apply display conversion only at final output. When adding/removing custom passes, call `updateOutputPass()` afterward so the last enabled pass receives output.

## Standalone effect and parameters

```ts
import { DrawEffect } from '@dimitrisgkegkas/postprocessing'
import { EffectPass } from 'postprocessing'
const effect = new DrawEffect({ paperTexture: paper, inkColor: '#82380d' })
customComposer.addPass(new EffectPass(camera, effect))
effect.setParams({ edgeStrength: 3, textureStrength: 5 })
effect.setPaperTexture(nextPaper) // old/new textures remain caller-owned
effect.setColorChannel('all')
const current = effect.getParams() // colors are cloned Three.Color instances
```

| Draw parameter    | Default             | Meaning                                               |
| ----------------- | ------------------- | ----------------------------------------------------- |
| `appearance`      | `1`                 | Reveal, clamped to 0–1                                |
| `inkColor`        | `rgb(51%, 22%, 5%)` | Ink wash color                                        |
| `outlineColor`    | black               | Outline color                                         |
| `edgeRadius`      | `0.5`               | Sampling radius in CSS pixels                         |
| `edgeStrength`    | `2`                 | Outline intensity multiplier                          |
| `textureStrength` | `10`                | Paper grain contrast; 0 disables grain                |
| `paperMidpoint`   | `0.734`             | Neutral paper brightness in sRGB                      |
| `usePaperTexture` | `true`              | Use supplied paper; missing texture always uses white |

Colors follow Three.js conventions: CSS strings and hex values are sRGB, `Color` instances contain linear values. Setters update uniforms in place; no shader recompilation. `setOptions` aliases `setParams`; the composer also retains `getEffect('draw')` and `setEffectParams('draw', params)`.

Exports also include `DRAW_DEFAULTS`, `ColorChannelEffect`, `CHANNEL_MASKS`, `resolveMultisampling`, `drawFragmentShader`, and public option types. Supported channels: `all`, `red`, `green`, `blue`, `redGreen`, `redBlue`, `greenBlue`.

## Input contract

This effect interprets RGB **data**, as produced by `@dimitrisgkegkas/fiber-material`: red = depth/orientation edges, green = grain/outline intensity, blue = lighting/ink density. It is not a general-purpose filter for arbitrary photographs. When assembling your own pipeline, put it immediately after the scene's data render, before color grading/tone mapping, then apply SMAA to the finished outlines. A white background represents blank paper.

Targets Three.js WebGLRenderer, not WebGPU/TSL. The package imports safely without a DOM and constructing DrawEffect performs no network requests. Creating the composer/SMAA and rendering require a browser and WebGL.

## R3F

Create the composer in an effect using `gl`, `scene`, and `camera` from `useThree`; dispose it in cleanup. Resize on width/height/DPR changes and render with `useFrame((_, delta) => composer?.render(delta), 1)`. Positive render priority takes over R3F's rendering loop. Keep texture loading/ownership and UI controls in the application. Do not allocate the composer during a React render.

## Build and distribution

From the repository root: `yarn build:packages`, `yarn dev:packages`, `yarn test`, or `yarn pack:packages`. From this folder: `yarn build`, `yarn dev`, or `npm pack`. Publishing runs a fresh build via `prepack`. Runtime peers are `three ~0.174.0` and `postprocessing ~6.37.1`; they are not bundled. Published under the personal `@dimitrisgkegkas` npm scope. Current license: UNLICENSED.
