import React, { Suspense } from 'react'
import { useControls } from 'leva'
import MetohologioScene from './MetohologioScene'
import MetohologioSceneV2 from './MetohologioSceneV2'
import CartoonBlob from './CartoonBlob'

const Map = () => {
    const { model } = useControls('Scene', {
        model: {
            value: 'v1',
            options: {
                'Metohologio v1': 'v1',
                'Metohologio v2': 'v2',
            },
        },
    })

    return (
        <Suspense fallback={null}>
            <CartoonBlob />
            <group name='map' >
                {model === 'v1' ? <MetohologioScene /> : <MetohologioSceneV2 />}
            </group>
        </Suspense >
    )
}

export default Map
