import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { CartoonBlobFiberMaterial } from '../Effects/material-shaders/CartoonBlobFiberMaterial'
import { usePlaneMaterialControls } from './PlaneMaterialControls'

type TextureComparisonPlanesProps = JSX.IntrinsicElements['group'] & {
    texture: THREE.Texture
}

export default function TextureComparisonPlanes({
    texture,
    ...props
}: TextureComparisonPlanesProps) {
    const { fiberMaterial } = usePlaneMaterialControls()

    const blueGradientMaterial = useMemo(
        () =>
            new CartoonBlobFiberMaterial({
                backgroundLight: fiberMaterial.backgroundLight,
                edgeNoiseStrength: fiberMaterial.edgeNoiseStrength,
                edgeStart: fiberMaterial.edgeStart,
                edgeEnd: fiberMaterial.edgeEnd,
                fiberScale: fiberMaterial.fiberScale,
                noiseScale: fiberMaterial.noiseScale,
                bandCount: fiberMaterial.bandCount,
                bandSoftness: fiberMaterial.bandSoftness,
                bandTextureInfluence: fiberMaterial.bandTextureInfluence,
                useStaticCamera: true,
                shadowTexture: texture,
                staticCameraPosition: [0, 0, 10],
                staticCameraTarget: [0, 0, 0],
                worldZStart: 0,
                worldZEnd: 1,
                side: THREE.DoubleSide,
            }),
        [fiberMaterial, texture]
    )

    const plainBlueGradientMaterial = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                map: texture,
                color: new THREE.Color(1.0, 1.0, 1.0),
                side: THREE.DoubleSide,
            }),
        [texture]
    )

    React.useEffect(() => {
        return () => {
            blueGradientMaterial.dispose()
            plainBlueGradientMaterial.dispose()
        }
    }, [blueGradientMaterial, plainBlueGradientMaterial])

    return (
        <group name='texture_comparison_planes' {...props}>
            <Text
                position={[0, 2.55, 0]}
                fontSize={0.18}
                color='#000000'
                anchorX='center'
                anchorY='middle'
            >
                Texture Through Custom Shader
            </Text>
            <mesh
                name='Blue_Gradient_Plane'
                position={[0, 1.2, 0]}
                material={blueGradientMaterial}
            >
                <planeGeometry args={[3, 2.2]} />
            </mesh>
            <Text
                position={[0, -2.8, 0]}
                fontSize={0.18}
                color='#000000'
                anchorX='center'
                anchorY='middle'
            >
                Plane Texture
            </Text>
            <mesh
                name='Plain_Blue_Gradient_Plane'
                position={[0, -1.4, 0]}
                material={plainBlueGradientMaterial}
            >
                <planeGeometry args={[3, 2.2]} />
            </mesh>
        </group>
    )
}
