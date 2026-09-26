import assert from 'node:assert/strict'
import { HalfFloatType, Texture, Vector3, WebGLRenderTarget } from 'three'
import { resolveMultisampling, DrawEffect, ColorChannelEffect, CHANNEL_MASKS, EffectComposer } from '../packages/postprocessing/dist/index.js'
import { CartoonBlobFiberMaterial } from '../packages/fiber-material/dist/index.js'

// Keep the known-good low-density rendering and the faster Retina rendering,
// including a round trip between displays and explicit caller overrides.
for (const [dpr, expected] of [
    [1, 8],
    [1.5, 8],
    [2, 0],
    [3, 0],
    [1, 8],
]) {
    assert.equal(resolveMultisampling(dpr, 'auto', 8), expected)
}
assert.equal(resolveMultisampling(1, 'auto', 4), 4)
assert.equal(resolveMultisampling(1, 'auto', 0), 0)
assert.equal(resolveMultisampling(2, 4, 8), 4)
assert.equal(resolveMultisampling(1, 0, 8), 0)
assert.equal(resolveMultisampling(2, 8, 4), 4)

const material = new CartoonBlobFiberMaterial()
const initialVersion = material.version
const bandUniform = material.uniforms.bandCount
material.setParams({ backgroundLight: 0.2, bandCount: 8, fiberScale: 3 })
assert.equal(material.version, initialVersion, 'controls must not request recompilation')
assert.equal(material.uniforms.bandCount, bandUniform, 'uniform objects must remain stable')
assert.equal(bandUniform.value, 8)
assert.equal(material.color.r, 0.2)

// Compare the cached matrix to the former GLSL camera-basis calculation,
// including both parallel-up fallbacks and updates to the same material.
for (const [position, target, up] of [
    [
        [0, 0, 10],
        [0, 0, 0],
        [0, 1, 0],
    ],
    [
        [0, 10, 10],
        [0, 0, 0],
        [0, 1, 0],
    ],
    [
        [0, 10, 0],
        [0, 0, 0],
        [0, 1, 0],
    ],
    [
        [1, 2, 3],
        [-2, 4, 1],
        [0.2, 1, 0.3],
    ],
]) {
    material.setParams({ staticCameraPosition: position, staticCameraTarget: target, staticCameraUp: up })
    material.updateStaticViewMatrix()
    const forward = new Vector3().fromArray(target).sub(new Vector3().fromArray(position)).normalize()
    const right = forward.clone().cross(new Vector3().fromArray(up).normalize())
    if (right.lengthSq() < 0.0001) right.crossVectors(forward, new Vector3(0, 1, 0))
    if (right.lengthSq() < 0.0001) right.crossVectors(forward, new Vector3(1, 0, 0))
    right.normalize()
    const cameraUp = right.clone().cross(forward).normalize()
    for (const normal of [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0.2, 0.7, -0.1).normalize()]) {
        const expected = new Vector3(normal.dot(right), normal.dot(cameraUp), -normal.dot(forward))
        const actual = normal.clone().applyMatrix3(material.uniforms.staticViewMatrix.value)
        assert.ok(actual.distanceTo(expected) < 1e-12)
    }
}

const paperTexture = new Texture()
const draw = new DrawEffect({ paperTexture })
const viewportUniform = draw.uniforms.get('edgeViewportSize')
for (const [widthCSS, heightCSS] of [
    [800, 600],
    [1600, 900],
    [640, 960],
]) {
    for (const dpr of [1, 1.5, 2]) {
        const renderer = {
            getSize: target => target.set(widthCSS, heightCSS),
            getPixelRatio: () => dpr,
            getDrawingBufferSize: target => target.set(widthCSS * dpr, heightCSS * dpr),
        }
        draw.update(renderer, { width: widthCSS * dpr, height: heightCSS * dpr }, 1 / 60)
        assert.equal(draw.uniforms.get('edgeViewportSize'), viewportUniform)
        assert.deepEqual(
            viewportUniform.value.toArray(),
            [widthCSS, heightCSS],
            'edge sampling must use CSS dimensions across resize and DPR changes'
        )
    }
}
const appearanceUniform = draw.uniforms.get('appearance')
let shaderChanges = 0
draw.addEventListener('change', () => shaderChanges++)
for (const appearance of [0, 0.25, 0.5, 1]) {
    draw.setParams({ appearance })
    assert.equal(draw.getParams().appearance, appearance)
    assert.equal(draw.uniforms.get('appearance'), appearanceUniform)
}
assert.equal(shaderChanges, 0, 'appearance changes must not rebuild the shader')

// Verify actual pass-selection methods for every draw/SMAA/channel combination.
const composer = Object.create(EffectComposer.prototype)
composer.outputToScreen = true
composer.renderPass = { enabled: true }
composer.colorChannelPass = { enabled: true }
composer.drawPass = { enabled: true }
composer.smaaPass = { enabled: true }
composer.passes = [composer.renderPass, composer.colorChannelPass, composer.drawPass, composer.smaaPass]
composer.drawEffect = draw
composer.colorChannelEffect = new ColorChannelEffect()
let renderDpr = 1
composer.renderer = {
    getDrawingBufferSize: target => target.set(800 * renderDpr, 600 * renderDpr),
}
composer.inputBuffer = new WebGLRenderTarget(800, 600, { type: HalfFloatType })
composer.outputBuffer = composer.inputBuffer.clone()
composer.depthTexture = null
for (const dpr of [1, 2, 1]) {
    renderDpr = dpr
    const samples = resolveMultisampling(dpr, 'auto', 4)
    if (composer.multisampling !== samples) composer.multisampling = samples
    assert.equal(composer.multisampling, samples)
    assert.equal(composer.outputBuffer.samples, samples)
    assert.equal(composer.inputBuffer.width, 800 * dpr)
    assert.equal(composer.inputBuffer.height, 600 * dpr)
    assert.equal(composer.inputBuffer.texture.type, HalfFloatType)
    assert.equal(composer.drawEffect, draw, 'display changes must retain the effect')
    assert.equal(draw.uniforms.get('appearance'), appearanceUniform)
    assert.equal(shaderChanges, 0, 'changing MSAA must not rebuild the draw shader')
}
composer.inputBuffer.dispose()
composer.outputBuffer.dispose()
for (const drawEnabled of [false, true]) {
    for (const smaaEnabled of [false, true]) {
        for (const [channel, mask] of Object.entries(CHANNEL_MASKS)) {
            composer.setDrawEffectEnabled(drawEnabled)
            composer.setAntialiasingEnabled(smaaEnabled)
            composer.setColorChannel(channel)
            const enabled = composer.passes.filter(pass => pass.enabled)
            const outputs = composer.passes.filter(pass => pass.renderToScreen)
            assert.deepEqual(outputs, [enabled.at(-1)])
            assert.equal(composer.colorChannelPass.enabled, !drawEnabled && (channel !== 'all' || !smaaEnabled))
            assert.deepEqual(draw.uniforms.get('channelMask').value.toArray(), mask)
        }
    }
}
let textureDisposals = 0
draw.uniforms.get('paperTexture').value.addEventListener('dispose', () => textureDisposals++)
draw.dispose()
assert.equal(textureDisposals, 0, 'borrowed paper texture must remain caller-owned')
paperTexture.dispose()
assert.equal(textureDisposals, 1)
material.dispose()
composer.colorChannelEffect.dispose()
console.log(
    'Passed: adaptive MSAA and overrides, CSS viewport sizing at 3 sizes and 3 DPRs, stable uniforms, camera matrix equivalence, 28 pass combinations, texture disposal.'
)
