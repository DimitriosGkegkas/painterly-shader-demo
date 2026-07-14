import React, { Suspense } from 'react'
import MapBase from './Map_Base'
import Monuments, { Instances as MonumentsInstances } from './Monuments'
import Buildings, { Instances as BuildingsInstances } from './Buildings'
import { Color } from 'three'

const Map = () => {


    return (
        <Suspense fallback={null}>
            <group name='map' position={[4, 5, -6]} rotation={[0, 0.8, 0]}>
                <MapBase />
                <MonumentsInstances>
                    <Monuments />
                </MonumentsInstances>
                <BuildingsInstances>
                    <Buildings />
                </BuildingsInstances>
                <color attach='background' args={[new Color(0, 0, 0)]} />
                <ambientLight intensity={3} />
                <directionalLight position={[-300, 50, -200]} intensity={2} color={new Color(0, 0, 1)} />
            </group>
        </Suspense >
    )
}

export default Map
