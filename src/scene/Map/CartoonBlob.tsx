import { useEffect, useMemo } from 'react'
import { Color } from 'three'
import { CartoonBlobFiberMaterial } from '../Effects/material-shaders/CartoonBlobFiberMaterial'
import { usePlaneMaterialControls } from './PlaneMaterialControls'

export default function CartoonBlob(props: JSX.IntrinsicElements['group']) {
    const { fiberMaterial } = usePlaneMaterialControls()

    const material = useMemo(
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
            }),
        [fiberMaterial]
    )

    useEffect(() => () => material.dispose(), [material])

    return (
        <group {...props}>
            <mesh material={material} castShadow receiveShadow>
                <torusKnotGeometry args={[0.95, 0.32, 220, 32]} />
            </mesh>
        </group>
    )
}
