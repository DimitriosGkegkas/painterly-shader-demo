import type { ComponentProps } from 'react'
import { Color } from 'three'
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
            <color attach='background' args={[new Color(1, 1, 1)]} />

            {/* <ambientLight intensity={10} /> */}
            {/* <directionalLight position={[-300, 50, -200]} intensity={2} color={new Color(0, 0, 1)} /> */}
        </Canvas>
    )
}

export default ExperiencePage
