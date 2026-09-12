/*
 * Metohologio V3 scene generated from:
 * public/Metohologio_example scene_v3-2.glb
 *
 * The GLB was inspected and converted with gltfjsx. The scene is cloned here
 * so its original hierarchy, skinned meshes, and animations stay intact while
 * the project-specific fiber materials are applied consistently.
 */

import * as THREE from 'three'
import React, { useMemo } from 'react'
import { useAnimations, useGLTF, useTexture } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { CartoonBlobFiberMaterial } from '../Effects/material-shaders/CartoonBlobFiberMaterial'
import { assetUrl } from '../../utils/assetUrl.js'

const modelUrl = assetUrl(
    'assets/model/Map/Metohologio_example_scene_v3-2-transformed.glb'
)

export default function MetohologioSceneV3(
    props: JSX.IntrinsicElements['group']
) {
    const group = React.useRef<THREE.Group>(null)
    const groundShadowTexture = useTexture(assetUrl('ground-path-inverted.png'))
    const { scene, animations } = useGLTF(modelUrl)

    const material = useMemo(
        () =>
            new CartoonBlobFiberMaterial({
                backgroundLight: 0.18,
                edgeNoiseStrength: 0,
                edgeStart: 0.3,
                edgeEnd: 0.6,
                fiberScale: 30,
                bandCount: 5,
                bandSoftness: 0.4,
                bandTextureInfluence: 1.5,
                noiseScale: 20,
            }),
        []
    )

    const groundMaterial = useMemo(
        () =>
            new CartoonBlobFiberMaterial({
                backgroundLight: 0.15,
                edgeNoiseStrength: 0,
                edgeStart: 0.0,
                edgeEnd: 1.0,
                useStaticCamera: true,
                shadowTexture: groundShadowTexture,
                staticCameraPosition: [0, 10, 10],
                staticCameraTarget: [0, 0, 0],
                worldZStart: 0,
                worldZEnd: 10,
                fiberScale: 10,
                bandCount: 5,
                bandSoftness: 0.5,
                bandTextureInfluence: 2,
                noiseScale: 10,
            }),
        [groundShadowTexture]
    )

    const clone = useMemo(() => {
        const nextScene = SkeletonUtils.clone(scene)

        nextScene.traverse((object) => {
            if (!(object as THREE.Mesh).isMesh) {
                return
            }

            const mesh = object as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.material = mesh.name === 'Ground' ? groundMaterial : material
        })

        return nextScene
    }, [groundMaterial, material, scene])

    const { actions } = useAnimations(animations, group)

    React.useEffect(() => {
        const activeActions = Object.values(actions)
        activeActions.forEach((action) => action?.reset().play())

        return () => {
            activeActions.forEach((action) => action?.stop())
        }
    }, [actions])

    return (
        <group ref={group} {...props} dispose={null}>
            <primitive object={clone} />
        </group>
    )
}

useGLTF.preload(modelUrl)
