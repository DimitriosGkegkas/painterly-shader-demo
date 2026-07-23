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
        >
            <Map />
            <ScrollCameraController />
            <ambientLight intensity={0.5} />
            <hemisphereLight args={[new Color('#fff7e8'), new Color('#7ea0b8'), 1.1]} />
            <directionalLight position={[8, 12, 6]} intensity={1.8} color={new Color('#fff1d6')} />
            <PostProcessing />
            <Perf position='top-left' />
        </Canvas>
    )
}

export default Experience
