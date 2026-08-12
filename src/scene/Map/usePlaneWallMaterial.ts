import React from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { usePlaneMaterialControls } from './PlaneMaterialControls'

export function usePlaneWallMaterial(
    baseMaterial?: THREE.MeshStandardMaterial | null
) {
    const { color, textureUrl } = usePlaneMaterialControls()
    const wallTexture = useTexture(textureUrl)
    const wallMaterial = React.useMemo(
        () => new THREE.MeshStandardMaterial(),
        []
    )

    React.useEffect(() => {
        wallTexture.colorSpace = THREE.SRGBColorSpace
        wallTexture.flipY = false
        wallTexture.wrapS = THREE.RepeatWrapping
        wallTexture.wrapT = THREE.RepeatWrapping
        wallTexture.repeat.set(1, 1)
        wallTexture.needsUpdate = true

        wallMaterial.map = wallTexture
        wallMaterial.color.setRGB(color.r, color.g, color.b)
        wallMaterial.roughness = baseMaterial?.roughness ?? 1
        wallMaterial.metalness = baseMaterial?.metalness ?? 0
        wallMaterial.transparent = baseMaterial?.transparent ?? false
        wallMaterial.side = baseMaterial?.side ?? THREE.FrontSide
        wallMaterial.needsUpdate = true
    }, [baseMaterial, color.b, color.g, color.r, wallMaterial, wallTexture])

    React.useEffect(() => {
        return () => {
            wallMaterial.dispose()
        }
    }, [wallMaterial])

    return wallMaterial
}
