import React from 'react'
import { button, useControls } from 'leva'
import { assetUrl } from '../../utils/assetUrl'

export type FiberMaterialControlsValue = {
    backgroundLight: number
    edgeNoiseStrength: number
    edgeStart: number
    edgeEnd: number
    fiberScale: number
    noiseScale: number
    bandCount: number
    bandSoftness: number
    bandTextureInfluence: number
}

export type PlaneMaterialControlsScene = 'v2' | 'debug'

type DebugPlaneMaterialControlsValue = {
    sceneModel: 'debug'
    textureUrl: string
    fiberMaterial: FiberMaterialControlsValue
}

type V2PlaneMaterialControlsValue = {
    sceneModel: 'v2'
    shadowTextureUrl: string
    fiberMaterial: FiberMaterialControlsValue
}

export type PlaneMaterialControlsValue =
    | DebugPlaneMaterialControlsValue
    | V2PlaneMaterialControlsValue

const DEBUG_DEFAULT_TEXTURE_URL = assetUrl('ground-path-inverted.png')
const V2_DEFAULT_SHADOW_TEXTURE_URL = assetUrl('texture_atlas_no_red_v2.png')

const PlaneMaterialControlsContext =
    React.createContext<PlaneMaterialControlsValue | null>(null)

function buildFiberMaterialValue(
    backgroundLight: number,
    edgeNoiseStrength: number,
    edgeStart: number,
    edgeEnd: number,
    fiberScale: number,
    noiseScale: number,
    bandCount: number,
    bandSoftness: number,
    bandTextureInfluence: number
): FiberMaterialControlsValue {
    return {
        backgroundLight,
        edgeNoiseStrength,
        edgeStart,
        edgeEnd,
        fiberScale,
        noiseScale,
        bandCount,
        bandSoftness,
        bandTextureInfluence,
    }
}

function DebugPlaneMaterialControlsProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const defaultTextureObjectUrlRef = React.useRef<string | null>(null)
    const [
        {
            textureImage,
            backgroundLight,
            edgeNoiseStrength,
            edgeStart,
            edgeEnd,
            fiberScale,
            noiseScale,
            bandCount,
            bandSoftness,
            bandTextureInfluence,
        },
        setControls,
        getControls,
    ] = useControls(
        'Debug Plane Material',
        () => ({
            textureImage: { image: undefined as string | undefined },
            backgroundLight: {
                value: 0.15,
                min: 0,
                max: 0.5,
                step: 0.005,
            },
            edgeNoiseStrength: {
                value: 0,
                min: 0,
                max: 1,
                step: 0.01,
            },
            edgeStart: {
                value: 0.28,
                min: 0,
                max: 1,
                step: 0.01,
            },
            edgeEnd: {
                value: 0.28,
                min: 0,
                max: 1,
                step: 0.01,
            },
            fiberScale: {
                value: 3,
                min: 0.1,
                max: 20,
                step: 0.1,
            },
            noiseScale: {
                value: 1,
                min: 0.1,
                max: 20,
                step: 0.1,
            },
            bandCount: {
                value: 5,
                min: 1,
                max: 12,
                step: 1,
            },
            bandSoftness: {
                value: 0.12,
                min: 0,
                max: 0.5,
                step: 0.01,
            },
            bandTextureInfluence: {
                value: 0.35,
                min: 0,
                max: 10,
                step: 0.2,
            },
        }),
        []
    )

    const resetTexture = React.useCallback(() => {
        setControls({
            textureImage: defaultTextureObjectUrlRef.current ?? undefined,
        })
    }, [setControls])

    useControls('Debug Plane Material', {
        resetTexture: button(resetTexture),
    })

    React.useEffect(() => {
        let isCancelled = false

        const initializeDefaultTexturePreview = async () => {
            try {
                const response = await fetch(DEBUG_DEFAULT_TEXTURE_URL)
                const blob = await response.blob()

                if (isCancelled) {
                    return
                }

                const nextObjectUrl = URL.createObjectURL(blob)

                if (defaultTextureObjectUrlRef.current) {
                    URL.revokeObjectURL(defaultTextureObjectUrlRef.current)
                }

                defaultTextureObjectUrlRef.current = nextObjectUrl

                if (!getControls('textureImage')) {
                    setControls({ textureImage: nextObjectUrl })
                }
            } catch {
                return
            }
        }

        initializeDefaultTexturePreview()

        return () => {
            isCancelled = true

            if (defaultTextureObjectUrlRef.current) {
                URL.revokeObjectURL(defaultTextureObjectUrlRef.current)
                defaultTextureObjectUrlRef.current = null
            }
        }
    }, [getControls, setControls])

    const fiberMaterial = React.useMemo(
        () =>
            buildFiberMaterialValue(
                backgroundLight,
                edgeNoiseStrength,
                edgeStart,
                edgeEnd,
                fiberScale,
                noiseScale,
                bandCount,
                bandSoftness,
                bandTextureInfluence
            ),
        [
            backgroundLight,
            edgeNoiseStrength,
            edgeStart,
            edgeEnd,
            fiberScale,
            noiseScale,
            bandCount,
            bandSoftness,
            bandTextureInfluence,
        ]
    )

    const value = React.useMemo<DebugPlaneMaterialControlsValue>(
        () => ({
            sceneModel: 'debug',
            textureUrl: textureImage ?? DEBUG_DEFAULT_TEXTURE_URL,
            fiberMaterial,
        }),
        [fiberMaterial, textureImage]
    )

    return (
        <PlaneMaterialControlsContext.Provider value={value}>
            {children}
        </PlaneMaterialControlsContext.Provider>
    )
}

function V2PlaneMaterialControlsProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const defaultShadowTextureObjectUrlRef = React.useRef<string | null>(null)
    const [
        {
            shadowTextureImage,
            backgroundLight,
            edgeNoiseStrength,
            edgeStart,
            edgeEnd,
            fiberScale,
            noiseScale,
            bandCount,
            bandSoftness,
            bandTextureInfluence,
        },
        setControls,
        getControls,
    ] = useControls(
        'Plane House Material',
        () => ({
            shadowTextureImage: { image: undefined as string | undefined },
            backgroundLight: {
                value: 0.22,
                min: 0,
                max: 0.5,
                step: 0.005,
            },
            edgeNoiseStrength: {
                value: 0,
                min: 0,
                max: 1,
                step: 0.01,
            },
            edgeStart: {
                value: 0.28,
                min: 0,
                max: 1,
                step: 0.01,
            },
            edgeEnd: {
                value: 0.58,
                min: 0,
                max: 1,
                step: 0.01,
            },
            fiberScale: {
                value: 1,
                min: 0.1,
                max: 20,
                step: 0.1,
            },
            noiseScale: {
                value: 10,
                min: 0.1,
                max: 20,
                step: 0.1,
            },
            bandCount: {
                value: 4,
                min: 1,
                max: 12,
                step: 1,
            },
            bandSoftness: {
                value: 0.5,
                min: 0,
                max: 0.5,
                step: 0.01,
            },
            bandTextureInfluence: {
                value: 1,
                min: 0,
                max: 10,
                step: 0.2,
            },
        }),
        []
    )

    const resetShadowTexture = React.useCallback(() => {
        setControls({
            shadowTextureImage:
                defaultShadowTextureObjectUrlRef.current ?? undefined,
        })
    }, [setControls])

    useControls('Plane House Material', {
        resetShadowTexture: button(resetShadowTexture),
    })

    React.useEffect(() => {
        let isCancelled = false

        const initializeDefaultTexturePreview = async (
            defaultTextureUrl: string,
            controlName: 'shadowTextureImage',
            objectUrlRef: React.MutableRefObject<string | null>
        ) => {
            try {
                const response = await fetch(defaultTextureUrl)
                const blob = await response.blob()

                if (isCancelled) {
                    return
                }

                const nextObjectUrl = URL.createObjectURL(blob)

                if (objectUrlRef.current) {
                    URL.revokeObjectURL(objectUrlRef.current)
                }

                objectUrlRef.current = nextObjectUrl

                if (!getControls(controlName)) {
                    setControls({ [controlName]: nextObjectUrl })
                }
            } catch {
                return
            }
        }

        initializeDefaultTexturePreview(
            V2_DEFAULT_SHADOW_TEXTURE_URL,
            'shadowTextureImage',
            defaultShadowTextureObjectUrlRef
        )

        return () => {
            isCancelled = true

            if (defaultShadowTextureObjectUrlRef.current) {
                URL.revokeObjectURL(defaultShadowTextureObjectUrlRef.current)
                defaultShadowTextureObjectUrlRef.current = null
            }
        }
    }, [getControls, setControls])

    const fiberMaterial = React.useMemo(
        () =>
            buildFiberMaterialValue(
                backgroundLight,
                edgeNoiseStrength,
                edgeStart,
                edgeEnd,
                fiberScale,
                noiseScale,
                bandCount,
                bandSoftness,
                bandTextureInfluence
            ),
        [
            backgroundLight,
            edgeNoiseStrength,
            edgeStart,
            edgeEnd,
            fiberScale,
            noiseScale,
            bandCount,
            bandSoftness,
            bandTextureInfluence,
        ]
    )

    const value = React.useMemo<V2PlaneMaterialControlsValue>(
        () => ({
            sceneModel: 'v2',
            shadowTextureUrl:
                shadowTextureImage ?? V2_DEFAULT_SHADOW_TEXTURE_URL,
            fiberMaterial,
        }),
        [fiberMaterial, shadowTextureImage]
    )

    return (
        <PlaneMaterialControlsContext.Provider value={value}>
            {children}
        </PlaneMaterialControlsContext.Provider>
    )
}

export function PlaneMaterialControlsProvider({
    sceneModel,
    children,
}: {
    sceneModel: PlaneMaterialControlsScene
    children: React.ReactNode
}) {
    if (sceneModel === 'debug') {
        return (
            <DebugPlaneMaterialControlsProvider>
                {children}
            </DebugPlaneMaterialControlsProvider>
        )
    }

    return (
        <V2PlaneMaterialControlsProvider>
            {children}
        </V2PlaneMaterialControlsProvider>
    )
}

export function usePlaneMaterialControls() {
    const context = React.useContext(PlaneMaterialControlsContext)

    if (!context) {
        throw new Error(
            'usePlaneMaterialControls must be used within PlaneMaterialControlsProvider'
        )
    }

    return context
}
