import type { ComponentProps } from 'react'
import { Suspense } from 'react'
import { Color } from 'three'
import { Canvas } from '@react-three/fiber'
import { PostProcessing } from '../Effects/postprocessing/PostProcessing'
import { Perf } from 'r3f-perf'
import ScrollCameraController from './controllers/ScrollCameraController'
import type { SceneModel } from '../../App'
import MetohologioSceneV2 from '../Map/MetohologioSceneV2'
import MetohologioSceneV3 from '../Map/MetohologioSceneV3'
import DebugPlanes from '../Map/DebugPlanes'
import { OrbitControls } from '@react-three/drei'

type ExperienceProps = Omit<ComponentProps<typeof Canvas>, 'children'> & {
    model: SceneModel
}

function Experience({ model, ...props }: ExperienceProps) {
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
            <color attach='background' args={[new Color(1, 0, 1)]} />
            <Suspense fallback={null}>
                <group name='map'>
                    {model === 'v2' && <MetohologioSceneV2 />}
                    {model === 'v3' && <MetohologioSceneV3 />}
                    {model === 'debug' && <DebugPlanes />}
                </group>
            </Suspense>
            {
                model === 'debug' ?
                    <OrbitControls enablePan={true} enableZoom={true} enableRotate={false} />
                    : <ScrollCameraController />
            }
            <ambientLight intensity={10} />
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
