import { useEffect, useMemo } from 'react'
import { Color } from 'three'
import { CartoonBlobMaterial } from '../Effects/material-shaders/CartoonBlobMaterial'

export default function CartoonBlob(props: JSX.IntrinsicElements['group']) {
    const material = useMemo(
        () =>
            new CartoonBlobMaterial({
                baseTintColor: new Color(0.56, 0.75, 1.0),
                outlineColor: new Color(0.02, 0.95, 0.82),
                shadeColor: new Color(0.03, 0.08, 0.18),
                litColor: new Color(0.48, 0.86, 1.0),
                blobAmount: 0.18,
                blobScale: 1.8,
                edgeNoiseStrength: 0.12,
                edgeStart: 0.22,
                edgeEnd: 0.52,
                bandCount: 4,
            }),
        []
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
