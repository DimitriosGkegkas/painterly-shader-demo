import Experience from './scene/Experience'
import { Leva } from 'leva'
import { useControls } from 'leva'
import { PlaneMaterialControlsProvider } from './scene/Map/PlaneMaterialControls'

export type SceneModel = 'v2' | 'v3' | 'debug'
export type CameraControl = 'orbit' | 'path'

function App() {
    const { model, cameraControl } = useControls('Scene', {
        model: {
            value: 'v3' as SceneModel,
            options: {
                Scene: 'v3',
                'Plane House': 'v2',
                Debug: 'debug',
            },
        },
        cameraControl: {
            label: 'Camera Control',
            value: 'path' as CameraControl,
            options: {
                Orbit: 'orbit',
                Path: 'path',
            },
        },
    }) as { model: SceneModel; cameraControl: CameraControl }

    const content = <Experience model={model} cameraControl={cameraControl} />
    const shouldUsePlaneMaterialControls = model === 'debug' || model === 'v2'

    return (
        <>
            {shouldUsePlaneMaterialControls ? (
                <PlaneMaterialControlsProvider
                    sceneModel={model === 'debug' ? 'debug' : 'v2'}
                >
                    {content}
                </PlaneMaterialControlsProvider>
            ) : (
                content
            )}
            <Leva collapsed />
        </>
    )
}

export default App
