import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { CartoonBlobFiberMaterial } from '../Effects/material-shaders/CartoonBlobFiberMaterial'
import { assetUrl } from '../../utils/assetUrl'
import { usePlaneWallMaterial } from './usePlaneWallMaterial'
import CartoonBlob from './CartoonBlob'

export default function DebugPlanes() {
    const userPlaneMaterial = usePlaneWallMaterial()
    const gradientShadowTexture = useTexture(assetUrl('vertical-gradient-0-to-1.png'))
    const blueGradientMaterial = useMemo(
        () =>
            new CartoonBlobFiberMaterial({
                inkColor: new THREE.Color(0.0, 0.0, 1.0),
                outlineColor: new THREE.Color(0.0, 0.0, 1.0),
                backgroundColor: new THREE.Color(0.0, 0.1, 1.0),
                fiberScale: 3,
                fiberInfluence: 1,
                fiberRotationStep: 0.1,
                fiberThreshold: 0.3,
                noiseScale: 1,
                useStaticCamera: true,
                shadowTexture: gradientShadowTexture,
                staticCameraPosition: [0, 0, 10],
                staticCameraTarget: [0, 0, 0],
                worldZStart: 0,
                worldZEnd: 1,
                side: THREE.DoubleSide,
            }),
        [gradientShadowTexture]
    )

    React.useEffect(() => {
        return () => {
            blueGradientMaterial.dispose()
        }
    }, [blueGradientMaterial])

    return (
        <group name='DebugPlanes'
            position={[7, 1, 0]}
                rotation={[0, Math.PI / 4, 0]}
        >
            <mesh
                name='User_Plane'
                position={[0, 0, 1.6]}
                rotation={[0, -Math.PI / 2, 0]}
                castShadow
                receiveShadow
                material={userPlaneMaterial}
            >
                <planeGeometry args={[3, 2.2]} />
            </mesh>
            <mesh
                name='Blue_Gradient_Plane'
                position={[0, 0, -1.6]}
                rotation={[0, -Math.PI / 2, 0]}
                material={blueGradientMaterial}
            >
                <planeGeometry args={[3, 2.2]} />
            </mesh>
            <CartoonBlob  position={[0, 0, 4]}/>
        </group>
    )
}
