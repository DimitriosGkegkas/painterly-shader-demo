import type { ComponentProps } from 'react'
import { Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { Color } from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { PostProcessing } from '../Effects/postprocessing/PostProcessing'
import { Perf } from 'r3f-perf'
import ScrollCameraController from './controllers/ScrollCameraController'
import type { CameraControl, SceneModel } from '../../App'
import MetohologioSceneV2 from '../Map/MetohologioSceneV2'
import MetohologioSceneV3 from '../Map/MetohologioSceneV3'
import DebugPlanes from '../Map/DebugPlanes'
import { OrbitControls } from '@react-three/drei'

type ExperienceProps = Omit<ComponentProps<typeof Canvas>, 'children'> & {
    model: SceneModel
    cameraControl: CameraControl
}

function RefreshShadows({ model }: { model: SceneModel }) {
    const { scene } = useThree()
    useLayoutEffect(() => {
        // Suspense may finish after the first frame. Refresh once the actual casters mount.
        scene.traverse((object) => {
            if ('shadow' in object && object.shadow) {
                (object.shadow as { needsUpdate: boolean }).needsUpdate = true
            }
        })
    }, [scene, model])
    return null
}

function Experience({ model, cameraControl, ...props }: ExperienceProps) {
    const [displayDpr, setDisplayDpr] = useState(() =>
        Math.min(2, Math.max(1, window.devicePixelRatio || 1))
    )

    useEffect(() => {
        let densityQuery: MediaQueryList | undefined
        const updateDensity = () => {
            densityQuery?.removeEventListener('change', updateDensity)
            const deviceDpr = window.devicePixelRatio || 1
            setDisplayDpr(Math.min(2, Math.max(1, deviceDpr)))
            // Re-arm even when the capped render DPR stays the same (e.g. 3 -> 2).
            // A monitor change need not change the canvas's CSS dimensions.
            densityQuery = window.matchMedia(`(resolution: ${deviceDpr}dppx)`)
            densityQuery.addEventListener('change', updateDensity)
        }
        updateDensity()
        return () => densityQuery?.removeEventListener('change', updateDensity)
    }, [])

    return (
        <Canvas
            {...props}
            id='main-canvas'
            className='window'
            resize={{ scroll: false }}
            dpr={displayDpr}
            gl={{ antialias: false }}
            shadows={true}
        >
            <color attach='background' args={[new Color(1, 0, 1)]} />
            <Suspense fallback={null}>
                <group name='map'>
                    {model === 'v2' && <MetohologioSceneV2 />}
                    {model === 'v3' && <MetohologioSceneV3 />}
                    {model === 'debug' && <DebugPlanes />}
                </group>
                <RefreshShadows model={model} />
            </Suspense>
            {cameraControl === 'path' && model === 'v3' ? (
                <ScrollCameraController />
            ) : (
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={model !== 'debug'}
                />
            )}
            <ambientLight intensity={10} />
            <directionalLight
                position={[8, 12, 6]}
                intensity={10}
                color={new Color(1.0, 1.0, 1.0)}
                castShadow
                shadow-autoUpdate={model === 'v3'}
                shadow-needsUpdate={true}
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
                position={[-8, 12, 6]}
                intensity={5}
                color={new Color(1.0, 1.0, 1.0)}
                castShadow
                shadow-autoUpdate={model === 'v3'}
                shadow-needsUpdate={true}
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
