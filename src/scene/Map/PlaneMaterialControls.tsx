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

type PlaneMaterialControlsValue = {
    textureUrl: string
    fiberMaterial: FiberMaterialControlsValue
}

const defaultTextureName = 'ground-path-inverted.png'
const defaultTextureUrl = assetUrl(defaultTextureName)

const PlaneMaterialControlsContext =
    React.createContext<PlaneMaterialControlsValue | null>(null)

export function PlaneMaterialControlsProvider({
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
        'Plane Material',
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

    useControls('Plane Material', {
        resetTexture: button(resetTexture),
    })

    React.useEffect(() => {
        let isCancelled = false

        const initializeDefaultTexturePreview = async () => {
            try {
                const response = await fetch(defaultTextureUrl)
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

    const fiberMaterial = React.useMemo<FiberMaterialControlsValue>(
        () => ({
            backgroundLight,
            edgeNoiseStrength,
            edgeStart,
            edgeEnd,
            fiberScale,
            noiseScale,
            bandCount,
            bandSoftness,
            bandTextureInfluence,
        }),
        [
            bandCount,
            bandSoftness,
            bandTextureInfluence,
            backgroundLight,
            edgeEnd,
            edgeNoiseStrength,
            edgeStart,
            fiberScale,
            noiseScale,
        ]
    )

    const value = React.useMemo(
        () => ({
            textureUrl: textureImage ?? defaultTextureUrl,
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

export function usePlaneMaterialControls() {
    const context = React.useContext(PlaneMaterialControlsContext)

    if (!context) {
        throw new Error(
            'usePlaneMaterialControls must be used within PlaneMaterialControlsProvider'
        )
    }

    return context
}
