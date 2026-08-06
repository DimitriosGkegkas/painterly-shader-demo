import type { ComponentProps } from 'react'
import { Color } from 'three'
import { Canvas } from '@react-three/fiber'
import { PostProcessing } from '../Effects/postprocessing/PostProcessing'
import Map from '../Map'
import { Perf } from 'r3f-perf'
import ScrollCameraController from './controllers/ScrollCameraController'

type ExperienceProps = Omit<ComponentProps<typeof Canvas>, 'children'>

function Experience(props: ExperienceProps) {
    return (
        <Canvas
            {...props}
            id='main-canvas'
            className='window'
            resize={{ scroll: false }}
            dpr={[1, 2]}
            gl={{ antialias: true }}
            shadows={true}
        >
             <color attach="background" args={[new Color(0,0,1)]} />
            <Map />
            <ScrollCameraController />
            <ambientLight intensity={10} />
            {/* <hemisphereLight args={[new Color('#fff7e8'), new Color('#7ea0b8'), 1.1]} /> */}
            <directionalLight
                position={[8, 12, 6]}
                intensity={10}
                color={new Color(1.0, 1.0, 1.0)}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-near={0.5}
                shadow-camera-far={50}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
                shadow-bias={-0.0001}
            />
            <directionalLight
                position={[-8, 12, -6]}
                intensity={10}
                color={new Color(1.0, 1.0, 1.0)}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-near={0.5}
                shadow-camera-far={50}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
                shadow-bias={-0.0001}
            />
            <PostProcessing />
            <Perf position='top-left' />
        </Canvas>
    )
}

export default Experience
