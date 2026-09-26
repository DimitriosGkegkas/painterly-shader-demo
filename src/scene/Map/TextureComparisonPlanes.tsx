import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { CartoonBlobFiberMaterial } from '../Effects/DemoFiberMaterial'
import { usePlaneMaterialControls } from './PlaneMaterialControls'

type TextureComparisonPlanesProps = JSX.IntrinsicElements['group'] & {
    label: string
    shadowTexture: THREE.Texture
    previewTexture?: THREE.Texture
}

export default function TextureComparisonPlanes({
    label,
    shadowTexture,
    previewTexture,
    ...props
}: TextureComparisonPlanesProps) {
    const { fiberMaterial } = usePlaneMaterialControls()
    const displayTexture = previewTexture ?? shadowTexture

    const blueGradientMaterial = useMemo(
        () =>
            new CartoonBlobFiberMaterial({
                useStaticCamera: true,
                shadowTexture,
                staticCameraPosition: [0, 0, 10],
                staticCameraTarget: [0, 0, 0],
                side: THREE.DoubleSide,
            }),
        [shadowTexture]
    )

    const plainBlueGradientMaterial = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                map: displayTexture,
                color: new THREE.Color(1.0, 1.0, 1.0),
                side: THREE.DoubleSide,
            }),
        [displayTexture]
    )

    React.useLayoutEffect(() => {
        blueGradientMaterial.setParams(fiberMaterial)
    }, [blueGradientMaterial, fiberMaterial])
    React.useEffect(() => () => blueGradientMaterial.dispose(), [blueGradientMaterial])
    React.useEffect(() => () => plainBlueGradientMaterial.dispose(), [plainBlueGradientMaterial])

    return (
        <group name='texture_comparison_planes' {...props}>
            <Text
                position={[0, 2.55, 0]}
                fontSize={0.18}
                color='#000000'
                anchorX='center'
                anchorY='middle'
            >
                {label} Through Custom Shader
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
                {label}
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
