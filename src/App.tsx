import Experience from './scene/Experience'
import { Leva } from 'leva'
import { PlaneMaterialControlsProvider } from './scene/Map/PlaneMaterialControls'

function App() {
    return (
        <PlaneMaterialControlsProvider>
            <Experience />
            <Leva collapsed />
        </PlaneMaterialControlsProvider>
    )
}

export default App
