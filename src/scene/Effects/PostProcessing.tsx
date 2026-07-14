import { HalfFloatType } from 'three'
import React, { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { isWebGL2Available } from 'three-stdlib'
import { EffectComposer as EffectComposerIml } from './EffectComposerIml'
import { useControls } from 'leva'

type PostProcessingProps = {
    enabled?: boolean
    frameBufferType?: number
    multisampling?: number
    renderPriority?: number
}

const PostProcessing = React.memo(
    ({ enabled = true, renderPriority = 1, multisampling = 8, frameBufferType = HalfFloatType }: PostProcessingProps) => {
        const { gl, scene, camera, size } = useThree()
        const { colorChannel, drawEffectEnabled, useNoiseTexture, useSketchTexture, usePaperTexture } = useControls('Post Processing', {
            drawEffectEnabled: {
                value: true,
            },
            useNoiseTexture: {
                value: true,
                label: 'Noise Texture',
            },
            useSketchTexture: {
                value: true,
                label: 'Sketch Texture',
            },
            usePaperTexture: {
                value: true,
                label: 'Paper Texture',
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
        })

        const composer = useMemo(() => {
            const effectComposer = new EffectComposerIml(gl, {
                multisampling: multisampling > 0 && isWebGL2Available() ? multisampling : 0,
                frameBufferType,
                antialias: true,
            })

            effectComposer.setMainCamera(camera)
            effectComposer.setMainScene(scene)

            return effectComposer
        }, [camera, frameBufferType, gl, multisampling, scene])

        useEffect(() => () => composer.dispose(), [composer])

        useEffect(() => {
            composer.setSize(size.width, size.height)
        }, [composer, size.height, size.width])

        useFrame(
            (_, delta) => {
                if (enabled) {
                    composer.render(delta)
                }
            },
            enabled ? renderPriority : 0
        )

        useEffect(() => {
            composer.setEffectEnable(drawEffectEnabled)
        }, [composer, drawEffectEnabled])

        useEffect(() => {
            composer.setOptions({
                useNoiseTexture,
                useSketchTexture,
                usePaperTexture,
            })
        }, [composer, useNoiseTexture, usePaperTexture, useSketchTexture])

        useEffect(() => {
            composer.setColorChannel(colorChannel)
        }, [colorChannel, composer])

        return null
    }
)

export default PostProcessing
export { PostProcessing }
