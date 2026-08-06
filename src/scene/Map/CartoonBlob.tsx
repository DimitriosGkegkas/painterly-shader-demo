import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, Mesh } from 'three'
import { CartoonBlobMaterial } from '../Effects/material-shaders/CartoonBlobMaterial'

export default function CartoonBlob(props: JSX.IntrinsicElements['group']) {
    const meshRef = useRef<Mesh>(null)
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

    // useFrame(({ clock }, delta) => {
    //     material.uniforms.time.value = clock.getElapsedTime()

    //     if (!meshRef.current) return

    //     meshRef.current.rotation.y += delta * 0.35
    //     meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.45) * 0.18
    //     meshRef.current.position.y = 2.35 + Math.sin(clock.getElapsedTime() * 0.8) * 0.18
    // })

    return (
        <group {...props}>
            <mesh ref={meshRef} material={material} position={[13, 2.35, -2]} castShadow receiveShadow>
                <torusKnotGeometry args={[0.95, 0.32, 220, 32]} />
            </mesh>
        </group>
    )
}
