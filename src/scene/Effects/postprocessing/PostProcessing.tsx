import { HalfFloatType } from 'three'
import React, { useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer as EffectComposerImpl } from './EffectComposerImpl'
import { useControls } from 'leva'
import { resolveMultisampling } from './antialiasing'

type PostProcessingProps = {
    enabled?: boolean
    frameBufferType?: number
    multisampling?: number | 'auto'
    renderPriority?: number
}

const rgbToCssColor = (r: number, g: number, b: number) =>
    `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`

const DRAW_DEFAULTS = {
    thickness: 0.6,
    scale: 2,
    noisiness: 0.002,
    fillColor: 0,
    inkColor: rgbToCssColor(48, 32, 10),
    showHatch: true,
    useNoiseTexture: true,
    useSketchTexture: true,
}

const PostProcessing = React.memo(
    ({ enabled = true, renderPriority = 1, multisampling = 'auto', frameBufferType = HalfFloatType }: PostProcessingProps) => {
        const { gl, scene, camera, size } = useThree()
        const dpr = useThree((state) => state.viewport.dpr)
        const samples = resolveMultisampling(dpr, multisampling, gl.capabilities.maxSamples)
        const controls = useControls('Post Processing', {
            drawEffect: {
                value: true,
                label: 'Draw Effect',
            },
            appearance: {
                value: 1,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Appearance',
            },
            antialiasing: {
                value: true,
                label: 'Antialiasing (SMAA)',
            },
            colorChannel: {
                value: 'all',
                options: {
                    all: 'all',
                    red: 'red',
                    green: 'green',
                    blue: 'blue',
                    'red + green': 'redGreen',
                    'red + blue': 'redBlue',
                    'green + blue': 'greenBlue',
                },
            },
            usePaperTexture: {
                value: true,
                label: 'Paper Texture',
            },
        })

        const [composer, setComposer] = useState<EffectComposerImpl | null>(null)

        // Allocate GPU resources in an effect so StrictMode's discarded render cannot leak them.
        useEffect(() => {
            const effectComposer = new EffectComposerImpl(gl, {
                frameBufferType,
            })

            effectComposer.setMainCamera(camera)
            effectComposer.setMainScene(scene)

            setComposer(effectComposer)
            return () => effectComposer.dispose()
        }, [camera, frameBufferType, gl, scene])

        useEffect(() => {
            // Change only the render buffers when density changes; retain effects,
            // their uniforms, and their shader programs. SMAA remains independent.
            if (composer && composer.multisampling !== samples) {
                composer.multisampling = samples
            }
        }, [composer, samples])

        useEffect(() => {
            composer?.setSize(size.width, size.height)
        }, [composer, size.height, size.width, dpr])

        useFrame(
            (_, delta) => {
                if (enabled) {
                    composer?.render(delta)
                }
            },
            enabled ? renderPriority : 0
        )

        useEffect(() => {
            composer?.setDrawEffectEnabled(controls.drawEffect)
        }, [composer, controls.drawEffect])

        useEffect(() => {
            composer?.setAntialiasingEnabled(controls.antialiasing)
        }, [composer, controls.antialiasing])

        useEffect(() => {
            composer?.setEffectParams('draw', {
                ...DRAW_DEFAULTS,
                appearance: controls.appearance,
                usePaperTexture: controls.usePaperTexture,
            })
        }, [
            composer,
            controls.appearance,
            controls.usePaperTexture,
        ])

        useEffect(() => {
            composer?.setColorChannel(controls.colorChannel)
        }, [composer, controls.colorChannel])

        return null
    }
)

export default PostProcessing
export { PostProcessing }
