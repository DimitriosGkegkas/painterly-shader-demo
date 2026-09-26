import { CartoonBlobFiberMaterial as FiberMaterial } from '@dimitrisgkegkas/fiber-material'
import type { FiberMaterialOptions } from '@dimitrisgkegkas/fiber-material'
import { DataTexture, NoColorSpace, RepeatWrapping, TextureLoader } from 'three'
import type { Texture } from 'three'
import { assetUrl } from '../../utils/assetUrl.js'

// Asset choices belong to the demo. The reusable material never loads URLs.
let textures: { fiberTexture: Texture; noiseTexture: Texture; shadowTexture: Texture } | undefined
function getDemoTextures() {
    if (!textures) {
        const loader = new TextureLoader()
        textures = {
            fiberTexture: loader.load(assetUrl('assets/textures/brush/height_map.png')),
            noiseTexture: loader.load(assetUrl('assets/textures/noise/cloud-noise.png')),
            shadowTexture: new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1),
        }
        for (const texture of Object.values(textures)) {
            texture.colorSpace = NoColorSpace
            texture.wrapS = texture.wrapT = RepeatWrapping
            texture.needsUpdate = true
        }
    }
    return textures
}

export class CartoonBlobFiberMaterial extends FiberMaterial {
    constructor(options: FiberMaterialOptions = {}) {
        super({ ...getDemoTextures(), ...options })
    }
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        if (textures) for (const texture of Object.values(textures)) texture.dispose()
    })
}
