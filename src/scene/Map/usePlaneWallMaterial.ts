import React from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { CartoonBlobFiberMaterial } from '../Effects/material-shaders/CartoonBlobFiberMaterial'
import { usePlaneMaterialControls } from './PlaneMaterialControls'

export function usePlaneWallMaterial(
    baseMaterial?: THREE.MeshStandardMaterial | null
) {
    const { color, textureUrl, useMaterialShader } = usePlaneMaterialControls()
    const wallTexture = useTexture(textureUrl)

    const wallMaterial = React.useMemo(() => {
        wallTexture.colorSpace = THREE.SRGBColorSpace
        wallTexture.flipY = false
        wallTexture.wrapS = THREE.RepeatWrapping
        wallTexture.wrapT = THREE.RepeatWrapping
        wallTexture.repeat.set(1, 1)
        wallTexture.needsUpdate = true

        if (useMaterialShader) {
            return new CartoonBlobFiberMaterial({
                inkColor: new THREE.Color(color.r, color.g, color.b),
                outlineColor: new THREE.Color(color.r, color.g, color.b),
                backgroundColor: new THREE.Color(1.0, 1.0, 0.0),
                roughness: baseMaterial?.roughness ?? 1,
                metalness: baseMaterial?.metalness ?? 0,
                transparent: baseMaterial?.transparent ?? false,
                side: baseMaterial?.side ?? THREE.FrontSide,
                fiberScale: 3,
                fiberInfluence: 1,
                fiberRotationStep: 0.1,
                fiberThreshold: 0.3,
                noiseScale: 1,
                useStaticCamera: true,
                shadowTexture: wallTexture,
                staticCameraPosition: [0, 0, 10],
                staticCameraTarget: [0, 0, 0],
                worldZStart: 0,
                worldZEnd: 1,
            })
        }

        return new THREE.MeshStandardMaterial({
            map: wallTexture,
            color: new THREE.Color(color.r, color.g, color.b),
            roughness: baseMaterial?.roughness ?? 1,
            metalness: baseMaterial?.metalness ?? 0,
            transparent: baseMaterial?.transparent ?? false,
            side: baseMaterial?.side ?? THREE.FrontSide,
        })
    }, [
        baseMaterial,
        color.b,
        color.g,
        color.r,
        useMaterialShader,
        wallTexture,
    ])

    React.useEffect(() => {
        return () => {
            wallMaterial.dispose()
        }
    }, [wallMaterial])

    return wallMaterial
}
