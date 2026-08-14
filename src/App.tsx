import Experience from './scene/Experience'
import { Leva } from 'leva'
import { useControls } from 'leva'
import { PlaneMaterialControlsProvider } from './scene/Map/PlaneMaterialControls'

export type SceneModel = 'v2' | 'v3' | 'debug'

function App() {
    const { model } = useControls('Scene', {
        model: {
            value: 'v3' as SceneModel,
            options: {
                'Scene': 'v3',
                'Plane House': 'v2',
                'Debug': 'debug',
            },
        },
    }) as { model: SceneModel }

    const content = <Experience model={model} />
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
