import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { build } from 'vite'
import { Color, Texture, Vector3, ShaderLib } from 'three'
import { DrawEffect } from '../packages/postprocessing/dist/index.js'
import { CartoonBlobFiberMaterial } from '../packages/fiber-material/dist/index.js'

// Ownership, cloning, shader injection, and instance isolation are library contracts.
const shared = new Texture()
let externalDisposals = 0
shared.addEventListener('dispose', () => externalDisposals++)
const draw = new DrawEffect({ paperTexture: shared, inkColor: '#ff0000', edgeRadius: 2 })
assert.equal(draw.uniforms.get('usePaperTexture').value, true)
assert.equal(draw.uniforms.get('inkColor').value.r, 1)
const snapshot = draw.getParams()
snapshot.inkColor.set('#000000')
assert.equal(draw.uniforms.get('inkColor').value.r, 1)
draw.setPaperTexture(null)
assert.equal(draw.uniforms.get('usePaperTexture').value, false)
draw.setPaperTexture(shared)
assert.equal(draw.uniforms.get('usePaperTexture').value, true)
draw.setParams({ usePaperTexture: false })
assert.equal(draw.uniforms.get('usePaperTexture').value, false)
assert.throws(() => draw.setParams({ edgeRadius: NaN }), TypeError)
draw.dispose()
assert.equal(externalDisposals, 0)

const material = new CartoonBlobFiberMaterial({ fiberTexture: shared, bandCount: 7, staticCameraPosition: [1, 2, 3] })
const fallback = material.uniforms.noiseTexture.value
let fallbackDisposals = 0
fallback.addEventListener('dispose', () => fallbackDisposals++)
const copy = material.clone()
assert.equal(copy.uniforms.fiberTexture.value, shared)
assert.notEqual(copy.uniforms.noiseTexture.value, fallback)
assert.equal(copy.uniforms.bandCount.value, 7)
copy.setParams({ bandCount: 3, staticCameraPosition: [4, 5, 6] })
assert.equal(material.uniforms.bandCount.value, 7)
assert.deepEqual(material.uniforms.staticCameraPosition.value.toArray(), [1, 2, 3])
assert.notEqual(copy.onBeforeCompile, material.onBeforeCompile)
const shader = { ...ShaderLib.standard, uniforms: {} }
copy.onBeforeCompile(shader)
assert.equal(shader.uniforms.bandCount, copy.uniforms.bandCount)
assert.ok(shader.fragmentShader.includes('gl_FragColor.rgb = vec3(depth01'))
assert.ok(shader.vertexShader.includes('vWorldNormal ='))
copy.setParams({ staticCameraPosition: [0, 0, 0], staticCameraTarget: [0, 0, 0] })
copy.updateStaticViewMatrix()
assert.ok(copy.uniforms.staticViewMatrix.value.elements.every(Number.isFinite))
material.setParams({ fiberTexture: null })
assert.notEqual(material.uniforms.fiberTexture.value, shared)
material.dispose()
material.dispose()
assert.equal(fallbackDisposals, 1)
copy.dispose()
assert.equal(externalDisposals, 0)
shared.dispose()

// Pack and consume in a separate directory: no source aliases, GLSL loader or React.
const root = fileURLToPath(new URL('../', import.meta.url))
const temporary = mkdtempSync(join(tmpdir(), 'shader-package-check-'))
try {
    mkdirSync(join(temporary, 'node_modules', '@dimitrisgkegkas'), { recursive: true })
    for (const peer of ['three', 'postprocessing', '@types']) {
        symlinkSync(join(root, 'node_modules', peer), join(temporary, 'node_modules', peer), 'dir')
    }
    for (const name of ['postprocessing', 'fiber-material']) {
        const result = JSON.parse(
            execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], {
                cwd: join(root, 'packages', name),
                encoding: 'utf8',
                env: { ...process.env, npm_config_cache: join(temporary, 'cache') },
            })
        )[0]
        assert.ok(result.files.some(file => file.path === 'dist/index.js'))
        assert.ok(result.files.some(file => file.path === 'dist/index.d.ts'))
        assert.ok(result.files.some(file => file.path === 'README.md'))
        assert.ok(result.files.every(file => !file.path.startsWith('src/')))
        const destination = join(temporary, 'node_modules', '@dimitrisgkegkas', name)
        mkdirSync(destination)
        execFileSync('tar', ['-xzf', join(temporary, result.filename), '--strip-components=1', '-C', destination])
        const code = readFileSync(join(destination, 'dist/index.js'), 'utf8')
        assert.ok(!code.includes('TextureLoader'), 'published modules must not load asset URLs')
        assert.ok(!code.includes('?raw'), 'published JS must contain compiled shader strings')
        console.log(`${result.name}: ${(result.size / 1024).toFixed(1)} KiB packed, ${result.files.length} files`)
    }
    writeFileSync(join(temporary, 'package.json'), JSON.stringify({ type: 'module' }))
    writeFileSync(
        join(temporary, 'consumer.mjs'),
        `
        import { DrawEffect } from '@dimitrisgkegkas/postprocessing'
        import { CartoonBlobFiberMaterial } from '@dimitrisgkegkas/fiber-material'
        export const effect = new DrawEffect()
        export const material = new CartoonBlobFiberMaterial()
    `
    )
    const consumer = await import(pathToFileURL(join(temporary, 'consumer.mjs')))
    consumer.effect.dispose()
    consumer.material.dispose()
    writeFileSync(
        join(temporary, 'consumer.ts'),
        `
        import { Scene, PerspectiveCamera, Texture, WebGLRenderer } from 'three'
        import { DrawEffect, ShaderEffectComposer, drawFragmentShader } from '@dimitrisgkegkas/postprocessing'
        import type { DrawParams } from '@dimitrisgkegkas/postprocessing'
        import { CartoonBlobFiberMaterial, fiberFragmentShader } from '@dimitrisgkegkas/fiber-material'
        const renderer = new WebGLRenderer()
        const composer = new ShaderEffectComposer(renderer, new Scene(), new PerspectiveCamera(), { multisampling: 'auto', renderToScreen: false })
        const config: DrawParams = { edgeRadius: 0.5, inkColor: '#ff0000' }
        composer.setDrawParams(config)
        composer.setPaperTexture(new Texture())
        const effect = new DrawEffect(config)
        const material = new CartoonBlobFiberMaterial({ roughness: 0.7, staticCameraPosition: [0, 1, 2] })
        material.setParams({ fiberTexture: null, bandCount: 5 })
        const sources: string[] = [drawFragmentShader, fiberFragmentShader]
        // @ts-expect-error unknown options must be rejected
        new DrawEffect({ nonexistentControl: true })
        // @ts-expect-error invalid channel must be rejected
        composer.setColorChannel('orange')
    `
    )
    execFileSync(
        process.execPath,
        [
            join(root, 'node_modules/typescript/bin/tsc'),
            '--noEmit',
            '--strict',
            '--skipLibCheck',
            '--target',
            'ES2020',
            '--module',
            'NodeNext',
            '--moduleResolution',
            'NodeNext',
            join(temporary, 'consumer.ts'),
        ],
        { stdio: 'inherit' }
    )
    await build({
        configFile: false,
        root: temporary,
        publicDir: false,
        logLevel: 'warn',
        build: { lib: { entry: join(temporary, 'consumer.mjs'), formats: ['es'], fileName: 'consumer' }, minify: false },
    })
    console.log(
        'Passed: texture ownership, clone isolation, shader injection, packed ESM imports, public types, and consumer build without a GLSL plugin.'
    )
} finally {
    rmSync(temporary, { recursive: true, force: true })
}
