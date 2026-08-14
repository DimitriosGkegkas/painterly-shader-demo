import React from 'react'
import { button, useControls } from 'leva'
import { createPortal } from 'react-dom'
import { assetUrl } from '../../utils/assetUrl'

type PlaneMaterialControlsValue = {
    textureUrl: string
    useMaterialShader: boolean
    color: {
        r: number
        g: number
        b: number
    }
}

const defaultTextureName = 'texture_atlas_no_red_v1.png'
const defaultTextureUrl = assetUrl(defaultTextureName)

const PlaneMaterialControlsContext =
    React.createContext<PlaneMaterialControlsValue | null>(null)

export function PlaneMaterialControlsProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const objectUrlRef = React.useRef<string | null>(null)
    const [textureUrl, setTextureUrl] = React.useState(defaultTextureUrl)

    const openTexturePicker = React.useCallback(() => {
        inputRef.current?.click()
    }, [])

    const resetTexture = React.useCallback(() => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current)
            objectUrlRef.current = null
        }

        setTextureUrl(defaultTextureUrl)
    }, [])

    const handleTextureChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]

            if (!file) {
                return
            }

            const nextObjectUrl = URL.createObjectURL(file)

            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current)
            }

            objectUrlRef.current = nextObjectUrl
            setTextureUrl(nextObjectUrl)
            event.target.value = ''
        },
        []
    )

    React.useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current)
            }
        }
    }, [])

    useControls('Plane Material', {
        uploadTexture: button(openTexturePicker),
        resetTexture: button(resetTexture),
    })

    const tintControls = useControls('Plane Material', {
        useMaterialShader: {
            value: false,
            label: 'Use Material Shader',
        },
        red: {
            value: 1,
            min: 0,
            max: 2,
            step: 0.01,
        },
        green: {
            value: 1,
            min: 0,
            max: 2,
            step: 0.01,
        },
        blue: {
            value: 0.7,
            min: 0,
            max: 2,
            step: 0.01,
        },
    }) as {
        useMaterialShader: boolean
        red: number
        green: number
        blue: number
    }
    const { useMaterialShader, red, green, blue } = tintControls

    const value = React.useMemo(
        () => ({
            textureUrl,
            useMaterialShader,
            color: {
                r: red,
                g: green,
                b: blue,
            },
        }),
        [blue, green, red, textureUrl, useMaterialShader]
    )

    return (
        <>
            <PlaneMaterialControlsContext.Provider value={value}>
                {children}
            </PlaneMaterialControlsContext.Provider>
            {typeof document !== 'undefined'
                ? createPortal(
                      <input
                          ref={inputRef}
                          hidden
                          type='file'
                          accept='image/*'
                          onChange={handleTextureChange}
                      />,
                      document.body
                  )
                : null}
        </>
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
