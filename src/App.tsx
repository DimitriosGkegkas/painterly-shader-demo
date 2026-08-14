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
                'Metohologio v2': 'v2',
                'Metohologio v3': 'v3',
                'Debug Planes': 'debug',
            },
        },
    }) as { model: SceneModel }

    const content = <Experience model={model} />

    return (
        <>
            {model === 'debug' ? (
                <PlaneMaterialControlsProvider>{content}</PlaneMaterialControlsProvider>
            ) : (
                content
            )}
            <Leva collapsed />
        </>
    )
}

export default App
