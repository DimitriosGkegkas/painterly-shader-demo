import { Suspense } from 'react'
import { useControls } from 'leva'
import MetohologioSceneV2 from './MetohologioSceneV2'
import MetohologioSceneV3 from './MetohologioSceneV3'
import CartoonBlob from './CartoonBlob'

const Map = () => {
    const { model } = useControls('Scene', {
        model: {
            value: 'v3',
            options: {
                'Metohologio v2': 'v2',
                'Metohologio v3': 'v3',
            },
        },
    })

    return (
        <Suspense fallback={null}>
            <CartoonBlob />
            <group name='map'>
                {model === 'v2' && <MetohologioSceneV2 />}
                {model === 'v3' && <MetohologioSceneV3 />}
            </group>
        </Suspense>
    )
}

export default Map
