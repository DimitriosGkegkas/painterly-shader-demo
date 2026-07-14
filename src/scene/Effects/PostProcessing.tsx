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

type EffectMode = 'none' | 'draw' | 'cartoon' | 'pencilLines'

const rgbToCssColor = (r: number, g: number, b: number) =>
    `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`

const PostProcessing = React.memo(
    ({ enabled = true, renderPriority = 1, multisampling = 8, frameBufferType = HalfFloatType }: PostProcessingProps) => {
        const { gl, scene, camera, size } = useThree()
        const effectPath = 'Post Processing.effect'
        const controls = useControls('Post Processing', {
            effect: {
                value: 'none',
                options: {
                    none: 'none',
                    draw: 'draw',
                    cartoon: 'cartoon',
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
            drawThickness: {
                value: 0.6,
                min: 0.1,
                max: 4,
                step: 0.01,
                label: 'Thickness',
                render: (get) => get(effectPath) === 'draw',
            },
            drawScale: {
                value: 2,
                min: 0.25,
                max: 6,
                step: 0.01,
                label: 'Scale',
                render: (get) => get(effectPath) === 'draw',
            },
            drawNoisiness: {
                value: 0.002,
                min: 0,
                max: 0.03,
                step: 0.0001,
                label: 'Noisiness',
                render: (get) => get(effectPath) === 'draw',
            },
            drawFillColor: {
                value: 0,
                min: 0,
                max: 1,
                step: 0.01,
                label: 'Color Fill',
                render: (get) => get(effectPath) === 'draw',
            },
            drawInkR: {
                value: 48,
                min: 0,
                max: 255,
                step: 1,
                label: 'Ink R',
                render: (get) => get(effectPath) === 'draw',
            },
            drawInkG: {
                value: 32,
                min: 0,
                max: 255,
                step: 1,
                label: 'Ink G',
                render: (get) => get(effectPath) === 'draw',
            },
            drawInkB: {
                value: 10,
                min: 0,
                max: 255,
                step: 1,
                label: 'Ink B',
                render: (get) => get(effectPath) === 'draw',
            },
            drawShowHatch: {
                value: true,
                label: 'Show Hatch',
                render: (get) => get(effectPath) === 'draw',
            },
            drawShowEdge: {
                value: true,
                label: 'Show Edge',
                render: (get) => get(effectPath) === 'draw',
            },
            drawShowColor: {
                value: true,
                label: 'Show Color',
                render: (get) => get(effectPath) === 'draw',
            },
            drawUseNoiseTexture: {
                value: true,
                label: 'Noise Texture',
                render: (get) => get(effectPath) === 'draw',
            },
            drawUseSketchTexture: {
                value: true,
                label: 'Sketch Texture',
                render: (get) => get(effectPath) === 'draw',
            },
            drawUsePaperTexture: {
                value: true,
                label: 'Paper Texture',
                render: (get) => get(effectPath) === 'draw',
            },
            cartoonThickness: {
                value: 0.7,
                min: 0.1,
                max: 3,
                step: 0.01,
                label: 'Thickness',
                render: (get) => get(effectPath) === 'cartoon',
            },
            cartoonScale: {
                value: 0.72,
                min: 0.1,
                max: 3,
                step: 0.01,
                label: 'Scale',
                render: (get) => get(effectPath) === 'cartoon',
            },
            cartoonNoisiness: {
                value: 0.007,
                min: 0,
                max: 0.03,
                step: 0.0001,
                label: 'Noisiness',
                render: (get) => get(effectPath) === 'cartoon',
            },
            cartoonAngle: {
                value: 0,
                min: 0,
                max: Math.PI * 2,
                step: 0.01,
                label: 'Angle',
                render: (get) => get(effectPath) === 'cartoon',
            },
            cartoonInkR: {
                value: 18,
                min: 0,
                max: 255,
                step: 1,
                label: 'Ink R',
                render: (get) => get(effectPath) === 'cartoon',
            },
            cartoonInkG: {
                value: 119,
                min: 0,
                max: 255,
                step: 1,
                label: 'Ink G',
                render: (get) => get(effectPath) === 'cartoon',
            },
            cartoonInkB: {
                value: 140,
                min: 0,
                max: 255,
                step: 1,
                label: 'Ink B',
                render: (get) => get(effectPath) === 'cartoon',
            },
            cartoonUseNoiseTexture: {
                value: true,
                label: 'Noise Texture',
                render: (get) => get(effectPath) === 'cartoon',
            },
            cartoonUseSketchTexture: {
                value: true,
                label: 'Sketch Texture',
                render: (get) => get(effectPath) === 'cartoon',
            },
            cartoonUsePaperTexture: {
                value: true,
                label: 'Paper Texture',
                render: (get) => get(effectPath) === 'cartoon',
            },
            pencilThickness: {
                value: 1.1,
                min: 0.1,
                max: 4,
                step: 0.01,
                label: 'Thickness',
                render: (get) => get(effectPath) === 'pencilLines',
            },
            pencilContour: {
                value: 1.8,
                min: 0.25,
                max: 5,
                step: 0.01,
                label: 'Contour',
                render: (get) => get(effectPath) === 'pencilLines',
            },
            pencilScale: {
                value: 0.55,
                min: 0.1,
                max: 2,
                step: 0.01,
                label: 'Scale',
                render: (get) => get(effectPath) === 'pencilLines',
            },
            pencilNoisiness: {
                value: 0.004,
                min: 0,
                max: 0.03,
                step: 0.0001,
                label: 'Noisiness',
                render: (get) => get(effectPath) === 'pencilLines',
            },
            pencilInkR: {
                value: 60,
                min: 0,
                max: 255,
                step: 1,
                label: 'Ink R',
                render: (get) => get(effectPath) === 'pencilLines',
            },
            pencilInkG: {
                value: 56,
                min: 0,
                max: 255,
                step: 1,
                label: 'Ink G',
                render: (get) => get(effectPath) === 'pencilLines',
            },
            pencilInkB: {
                value: 50,
                min: 0,
                max: 255,
                step: 1,
                label: 'Ink B',
                render: (get) => get(effectPath) === 'pencilLines',
            },
            pencilUseNoiseTexture: {
                value: true,
                label: 'Noise Texture',
                render: (get) => get(effectPath) === 'pencilLines',
            },
            pencilUseSketchTexture: {
                value: true,
                label: 'Sketch Texture',
                render: (get) => get(effectPath) === 'pencilLines',
            },
            pencilUsePaperTexture: {
                value: true,
                label: 'Paper Texture',
                render: (get) => get(effectPath) === 'pencilLines',
            },
        })

        const selectedEffect = controls.effect as EffectMode

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
            composer.setEffectMode(selectedEffect)
        }, [composer, selectedEffect])

        useEffect(() => {
            composer.setEffectParams('draw', {
                thickness: controls.drawThickness,
                scale: controls.drawScale,
                noisiness: controls.drawNoisiness,
                fillColor: controls.drawFillColor,
                inkColor: rgbToCssColor(controls.drawInkR, controls.drawInkG, controls.drawInkB),
                showHatch: controls.drawShowHatch,
                showEdge: controls.drawShowEdge,
                showColor: controls.drawShowColor,
                useNoiseTexture: controls.drawUseNoiseTexture,
                useSketchTexture: controls.drawUseSketchTexture,
                usePaperTexture: controls.drawUsePaperTexture,
            })

            composer.setEffectParams('cartoon', {
                thickness: controls.cartoonThickness,
                scale: controls.cartoonScale,
                noisiness: controls.cartoonNoisiness,
                angle: controls.cartoonAngle,
                inkColor: rgbToCssColor(controls.cartoonInkR, controls.cartoonInkG, controls.cartoonInkB),
                useNoiseTexture: controls.cartoonUseNoiseTexture,
                useSketchTexture: controls.cartoonUseSketchTexture,
                usePaperTexture: controls.cartoonUsePaperTexture,
            })

            composer.setEffectParams('pencilLines', {
                thickness: controls.pencilThickness,
                contour: controls.pencilContour,
                scale: controls.pencilScale,
                noisiness: controls.pencilNoisiness,
                inkColor: rgbToCssColor(controls.pencilInkR, controls.pencilInkG, controls.pencilInkB),
                useNoiseTexture: controls.pencilUseNoiseTexture,
                useSketchTexture: controls.pencilUseSketchTexture,
                usePaperTexture: controls.pencilUsePaperTexture,
            })
        }, [
            composer,
            controls.cartoonAngle,
            controls.cartoonInkB,
            controls.cartoonInkG,
            controls.cartoonInkR,
            controls.cartoonNoisiness,
            controls.cartoonScale,
            controls.cartoonThickness,
            controls.cartoonUseNoiseTexture,
            controls.cartoonUsePaperTexture,
            controls.cartoonUseSketchTexture,
            controls.drawFillColor,
            controls.drawInkB,
            controls.drawInkG,
            controls.drawInkR,
            controls.drawNoisiness,
            controls.drawScale,
            controls.drawShowColor,
            controls.drawShowEdge,
            controls.drawShowHatch,
            controls.drawThickness,
            controls.drawUseNoiseTexture,
            controls.drawUsePaperTexture,
            controls.drawUseSketchTexture,
            controls.pencilContour,
            controls.pencilInkB,
            controls.pencilInkG,
            controls.pencilInkR,
            controls.pencilNoisiness,
            controls.pencilScale,
            controls.pencilThickness,
            controls.pencilUseNoiseTexture,
            controls.pencilUsePaperTexture,
            controls.pencilUseSketchTexture,
        ])

        useEffect(() => {
            composer.setColorChannel(controls.colorChannel)
        }, [composer, controls.colorChannel])

        return null
    }
)

export default PostProcessing
export { PostProcessing }
