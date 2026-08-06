import { HalfFloatType } from 'three'
import React, { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { isWebGL2Available } from 'three-stdlib'
import { EffectComposer as EffectComposerImpl } from './EffectComposerImpl'
import { useControls } from 'leva'

type PostProcessingProps = {
    enabled?: boolean
    frameBufferType?: number
    multisampling?: number
    renderPriority?: number
}

type EffectMode = 'none' | 'draw' | 'pencilLines'

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

const PENCIL_DEFAULTS = {
    thickness: 1,
    contour: 1,
    scale: 0.55,
    noisiness: 0.004,
    inkColor: rgbToCssColor(82, 31, 51),
    useNoiseTexture: true,
    useSketchTexture: true,
}

const PostProcessing = React.memo(
    ({ enabled = true, renderPriority = 1, multisampling = 8, frameBufferType = HalfFloatType }: PostProcessingProps) => {
        const { gl, scene, camera, size } = useThree()
        const effectPath = 'Post Processing.effect'
        const controls = useControls('Post Processing', {
            effect: {
                value: 'draw',
                options: {
                    none: 'none',
                    draw: 'draw',
                    'pencil lines': 'pencilLines',
                },
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

        const selectedEffect = controls.effect as EffectMode

        const composer = useMemo(() => {
            const effectComposer = new EffectComposerImpl(gl, {
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
            composer.setEffectMode(selectedEffect)
        }, [composer, selectedEffect])

        useEffect(() => {
            composer.setEffectParams('draw', {
                ...DRAW_DEFAULTS,
                usePaperTexture: controls.usePaperTexture,
            })

            composer.setEffectParams('pencilLines', {
                ...PENCIL_DEFAULTS,
                usePaperTexture: controls.usePaperTexture,
            })
        }, [
            composer,
            controls.usePaperTexture,
        ])

        useEffect(() => {
            composer.setColorChannel(controls.colorChannel)
        }, [composer, controls.colorChannel])

        return null
    }
)

export default PostProcessing
export { PostProcessing }
