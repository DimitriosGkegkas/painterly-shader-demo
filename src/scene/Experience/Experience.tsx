import type { ComponentProps } from 'react'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { PostProcessing } from '../Effects/PostProcessing'
import Map from '../Map'
import { Perf } from 'r3f-perf'

type ExperiencePageProps = Omit<ComponentProps<typeof Canvas>, 'children'>

function ExperiencePage(props: ExperiencePageProps) {
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
            <PostProcessing />
            <OrbitControls makeDefault enablePan enableZoom />
            <Perf position='top-left' />
        </Canvas>
    )
}

export default ExperiencePage
