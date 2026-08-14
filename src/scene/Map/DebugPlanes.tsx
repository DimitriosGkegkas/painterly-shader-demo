import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import CartoonBlob from './CartoonBlob'
import TextureComparisonPlanes from './TextureComparisonPlanes'
import { usePlaneMaterialControls } from './PlaneMaterialControls'
import { assetUrl } from '@/utils/assetUrl'

export default function DebugPlanes() {
    const { textureUrl } = usePlaneMaterialControls()
    const inputTexture = useTexture(textureUrl)
    const gradientShadowTexture = useTexture(assetUrl('vertical-gradient-0-to-1.png'))

    return (
        <group name='DebugPlanes'
            position={[-1.5, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
        >
            <TextureComparisonPlanes
                texture={inputTexture}
                position={[0, 0, -2]}
                rotation={[0, -Math.PI / 2, 0]}
            />
            <TextureComparisonPlanes
                texture={gradientShadowTexture}
                position={[0, 0, 1.2]}
                rotation={[0, -Math.PI / 2, 0]}
            />
            <CartoonBlob  position={[0, 0, 4]}/>
        </group>
    )
}
