import React, { Suspense } from 'react'
import MapBase from './Map_Base'
import Monuments, { Instances as MonumentsInstances } from './Monuments'
import Buildings, { Instances as BuildingsInstances } from './Buildings'
import CartoonBlob from './CartoonBlob'

const Map = () => {
    return (
        <Suspense fallback={null}>
            <group name='map' position={[0, -0.5, 0]} rotation={[0, 0.8, 0]}>
                <MapBase />
                <MonumentsInstances>
                    <Monuments />
                </MonumentsInstances>
                <BuildingsInstances>
                    <Buildings />
                </BuildingsInstances>
                <CartoonBlob />
            </group>
        </Suspense >
    )
}

export default Map
