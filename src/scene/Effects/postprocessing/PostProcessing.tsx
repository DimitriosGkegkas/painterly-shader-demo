import { HalfFloatType, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import { assetUrl } from '../../../utils/assetUrl.js'
import React, { useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ShaderEffectComposer as EffectComposerImpl, resolveMultisampling } from '@dimitrisgkegkas/postprocessing'
import type { ColorChannel } from '@dimitrisgkegkas/postprocessing'
import { useControls } from 'leva'

type PostProcessingProps = {
    enabled?: boolean
    frameBufferType?: number
    multisampling?: number | 'auto'
    renderPriority?: number
}

const PostProcessing = React.memo(
    ({ enabled = true, renderPriority = 1, multisampling = 'auto', frameBufferType = HalfFloatType }: PostProcessingProps) => {
        const { gl, scene, camera, size } = useThree()
        const dpr = useThree(state => state.viewport.dpr)
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
            const paperTexture = new TextureLoader().load(assetUrl('assets/textures/paper/Craft_Light.jpg'))
            paperTexture.wrapS = paperTexture.wrapT = RepeatWrapping
            paperTexture.colorSpace = SRGBColorSpace
            const effectComposer = new EffectComposerImpl(gl, scene, camera, {
                frameBufferType,
                paperTexture,
            })

            setComposer(effectComposer)
            return () => {
                effectComposer.dispose()
                paperTexture.dispose()
            }
        }, [camera, frameBufferType, gl, scene])

        useEffect(() => {
            // Change only the render buffers when density changes; retain effects,
            // their uniforms, and their shader programs. SMAA remains independent.
            if (composer && composer.multisampling !== samples) {
                composer.setMultisampling(samples)
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
                appearance: controls.appearance,
                usePaperTexture: controls.usePaperTexture,
            })
        }, [composer, controls.appearance, controls.usePaperTexture])

        useEffect(() => {
            composer?.setColorChannel(controls.colorChannel as ColorChannel)
        }, [composer, controls.colorChannel])

        return null
    }
)

export default PostProcessing
export { PostProcessing }
