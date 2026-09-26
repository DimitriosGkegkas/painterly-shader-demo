import { useEffect, useLayoutEffect, useMemo } from 'react'
import { CartoonBlobFiberMaterial } from '../Effects/DemoFiberMaterial'
import { usePlaneMaterialControls } from './PlaneMaterialControls'

export default function CartoonBlob(props: JSX.IntrinsicElements['group']) {
    const { fiberMaterial } = usePlaneMaterialControls()

    const material = useMemo(() => new CartoonBlobFiberMaterial(), [])

    useLayoutEffect(() => material.setParams(fiberMaterial), [material, fiberMaterial])
    useEffect(() => () => material.dispose(), [material])

    return (
        <group {...props}>
            <mesh material={material} castShadow receiveShadow>
                <torusKnotGeometry args={[0.95, 0.32, 220, 32]} />
            </mesh>
        </group>
    )
}
