/*
Custom Metohologio v3 scene.
*/

import * as THREE from 'three'
import React, { useMemo } from 'react'
import { useGraph } from '@react-three/fiber'
import { useGLTF, useAnimations, useTexture } from '@react-three/drei'
import { GLTF, SkeletonUtils } from 'three-stdlib'
import { CartoonBlobFiberMaterial } from '../Effects/material-shaders/CartoonBlobFiberMaterial'
import { CartoonBlobFiberStaticMaterial } from '../Effects/material-shaders/CartoonBlobFiberStaticMaterial'
import { assetUrl } from '../../utils/assetUrl.js'
import { usePlaneWallMaterial } from './usePlaneWallMaterial'

const modelUrl = assetUrl('assets/model/Map/Metohologio_example_scene_v1-transformed.glb')

type ActionName =
    | 'Action.004'
    | 'Action.005'
    | 'Armature.004Action.004'
    | 'Armature.004Action.005'
    | 'Armature.004|Armature.002Action.002'
    | 'Armature.004|Armature.004Action.002'
    | 'Armature.005|Armature|3030509026704_TempMotion|3030509026704_Te'
    | 'Armature|3030509026704_TempMotion|3030509026704_TempMotion.001'
    | 'Armature|3030509026704_TempMotion|3030509026704_TempMotion.004'
    | 'Action.006'
    | 'Armature.004Action'
    | 'Armature.004Action.001'

interface GLTFAction extends THREE.AnimationClip {
    name: ActionName
}

type GLTFResult = GLTF & {
    nodes: {
        Large_Sheep: THREE.SkinnedMesh
        Small_Sheep: THREE.SkinnedMesh
        Stone001: THREE.Mesh
        Ground: THREE.Mesh
        Wall: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
        Grass003: THREE.SkinnedMesh
        Grass001: THREE.SkinnedMesh
        Grass002: THREE.SkinnedMesh
        Grass004: THREE.SkinnedMesh
        Grass005: THREE.SkinnedMesh
        Grass006: THREE.SkinnedMesh
        Grass007: THREE.SkinnedMesh
        Grass: THREE.SkinnedMesh
        RL_BoneRoot: THREE.Bone
        RL_BoneRoot_1: THREE.Bone
        Bone: THREE.Bone
        Bone_1: THREE.Bone
        Bone_2: THREE.Bone
        Bone_3: THREE.Bone
        Bone_4: THREE.Bone
        Bone_5: THREE.Bone
        Bone_7: THREE.Bone
        Bone_6: THREE.Bone
    }
    materials: Record<'painterly.002', THREE.MeshStandardMaterial>
    animations: GLTFAction[]
}

export default function MetohologioSceneV3(props: JSX.IntrinsicElements['group']) {
    const group = React.useRef<THREE.Group>(null)
    const { scene, animations } = useGLTF(modelUrl)
    const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
    const { nodes } = useGraph(clone) as GLTFResult
    const { actions } = useAnimations(animations, group)
    const groundShadowTexture = useTexture(assetUrl('ground-path.png'))
    const userPlaneMaterial = usePlaneWallMaterial(nodes.Wall.material)


    const material = useMemo(
        () =>
            new CartoonBlobFiberMaterial({
                inkColor: new THREE.Color(0.5, 0, 1),
                outlineColor: new THREE.Color(0.5, 0, 0),
                backgroundColor: new THREE.Color(0.5, 0.0, 0),
                edgeNoiseStrength: 0,
                edgeStart: 0.28,
                edgeEnd: 0.28,
                fiberScale: 3,
                fiberInfluence: 1,
                fiberRotationStep: 0.1,
                fiberThreshold: 0.3,
                noiseScale: 10.0,
            }),
        []
    )

    const groundMaterial = useMemo(
        () =>
            new CartoonBlobFiberStaticMaterial({
                inkColor: new THREE.Color(0.5, 0, 1),
                outlineColor: new THREE.Color(0.5, 0, 0),
                backgroundColor: new THREE.Color(0.5, 0.0, 0),
                edgeNoiseStrength: 0,
                edgeStart: 0.28,
                edgeEnd: 0.28,
                fiberScale: 3,
                fiberInfluence: 1,
                fiberRotationStep: 0.1,
                fiberThreshold: 0.3,
                shadowTexture: groundShadowTexture,
                staticCameraPosition: [0, 10, 10],
                staticCameraTarget: [0, 0, 0],
                worldZStart: 0,
                worldZEnd: 10,
                noiseScale: 20.0,
            }),
        [groundShadowTexture]
    )
    React.useEffect(() => {
        const activeActions = Object.values(actions)
        activeActions.forEach((action) => action?.reset().play())

        return () => {
            activeActions.forEach((action) => action?.stop())
        }
    }, [actions])

    return (
        <group ref={group} {...props} dispose={null}>
            <group name='Scene'>
                <group
                    castShadow
                    receiveShadow
                    name='Large_Sheep_Armature'
                    position={[3.36, -0.037, 3.251]}
                    rotation={[0, -1.415, 0]}
                    scale={1.13}
                >
                    <primitive object={nodes.RL_BoneRoot} />
                    <skinnedMesh
                        name='Large_Sheep'
                        geometry={nodes.Large_Sheep.geometry}
                        material={material}
                        skeleton={nodes.Large_Sheep.skeleton}
                        castShadow
                        receiveShadow
                    />
                </group>
                <group
                    castShadow
                    receiveShadow
                    name='Small_Sheep_Armature'
                    position={[3.301, -0.1, 3.002]}
                    rotation={[0, -0.625, 0]}
                    scale={0.637}
                >
                    <primitive object={nodes.RL_BoneRoot_1} />
                </group>
                <group
                    castShadow
                    receiveShadow
                    name='Grass_Armature003'
                    position={[0.189, -0.052, 0.251]}
                    rotation={[0, 0.133, 0]}
                    scale={1.389}
                >
                    <primitive object={nodes.Bone} />
                </group>
                <group
                    castShadow
                    receiveShadow
                    name='Grass_Armature001'
                    position={[1.069, -0.023, -0.465]}
                    rotation={[0, 0.133, 0]}
                    scale={2.502}
                >
                    <primitive object={nodes.Bone_1} />
                </group>
                <group
                    castShadow
                    receiveShadow
                    name='Grass_Armature002'
                    position={[3.195, -0.023, -11.633]}
                    rotation={[0, 0.133, 0]}
                    scale={2.679}
                >
                    <primitive object={nodes.Bone_2} />
                </group>
                <group
                    castShadow
                    receiveShadow
                    name='Grass_Armature004'
                    position={[3.76, 0.033, -11.568]}
                    rotation={[0, 0.133, 0]}
                    scale={4.825}
                >
                    <primitive object={nodes.Bone_3} />
                </group>
                <group
                    castShadow
                    receiveShadow
                    name='Grass_Armature005'
                    position={[3.471, 0.065, -12.207]}
                    rotation={[0, 0.672, 0]}
                    scale={6.152}
                >
                    <primitive object={nodes.Bone_4} />
                </group>
                <group
                    castShadow
                    receiveShadow
                    name='Grass_Armature006'
                    position={[2.596, 0.005, -11.713]}
                    rotation={[0, 0.672, 0]}
                    scale={3.694}
                >
                    <primitive object={nodes.Bone_5} />
                </group>
                <group
                    castShadow
                    receiveShadow
                    name='Grass_Armature007'
                    position={[2.804, -0.009, -11.357]}
                    rotation={[0, 0.133, 0]}
                    scale={1.904}
                >
                    <primitive object={nodes.Bone_7} />
                </group>
                <group
                    castShadow
                    receiveShadow
                    name='Grass_Armature'
                    position={[7.724, -0.143, -12.22]}
                    rotation={[0, 0.133, 0]}
                    scale={2.679}
                >
                    <primitive object={nodes.Bone_6} />
                </group>
                <mesh
                    castShadow
                    receiveShadow
                    name='Stone001'
                    geometry={nodes.Stone001.geometry}
                    material={material}
                    position={[0.232, 0.249, -0.185]}
                    scale={1.389}
                />
                <mesh
                    castShadow
                    receiveShadow
                    name='Ground'
                    geometry={nodes.Ground.geometry}
                    material={groundMaterial}
                    position={[0, -0.848, 0.267]}
                    scale={1.811}
                />
                <mesh
                    castShadow
                    name='Wall'
                    geometry={nodes.Wall.geometry}
                    material={new THREE.MeshStandardMaterial({ color: new THREE.Color(1.0, 1, 0.25) })}
                />
                <mesh
                    castShadow
                    receiveShadow
                    name='User_Plane'
                    position={[6.3, 1.6, -8.1]}
                    rotation={[0, -Math.PI / 2, 0]}
                    material={userPlaneMaterial}
                >
                    <planeGeometry args={[3, 2.2]} />
                </mesh>
                <skinnedMesh
                    name='Grass003'
                    geometry={nodes.Grass003.geometry}
                    material={material}
                    skeleton={nodes.Grass003.skeleton}
                    position={[0.189, -0.052, 0.251]}
                    rotation={[0, 0.133, 0]}
                    scale={1.389}
                />
                <skinnedMesh
                    name='Grass001'
                    geometry={nodes.Grass001.geometry}
                    material={material}
                    skeleton={nodes.Grass001.skeleton}
                    position={[1.069, -0.023, -0.465]}
                    rotation={[0, 0.133, 0]}
                    scale={2.502}
                />
                <skinnedMesh
                    name='Grass002'
                    geometry={nodes.Grass002.geometry}
                    material={material}
                    skeleton={nodes.Grass002.skeleton}
                    position={[3.195, -0.023, -11.633]}
                    rotation={[0, 0.133, 0]}
                    scale={2.679}
                />
                <skinnedMesh
                    name='Grass004'
                    geometry={nodes.Grass004.geometry}
                    material={material}
                    skeleton={nodes.Grass004.skeleton}
                    position={[3.76, 0.033, -11.568]}
                    rotation={[0, 0.133, 0]}
                    scale={4.825}
                />
                <skinnedMesh
                    name='Grass005'
                    geometry={nodes.Grass005.geometry}
                    material={material}
                    skeleton={nodes.Grass005.skeleton}
                    position={[3.471, 0.065, -12.207]}
                    rotation={[0, 0.672, 0]}
                    scale={6.152}
                />
                <skinnedMesh
                    name='Grass006'
                    geometry={nodes.Grass006.geometry}
                    material={material}
                    skeleton={nodes.Grass006.skeleton}
                    position={[2.596, 0.005, -11.713]}
                    rotation={[0, 0.672, 0]}
                    scale={3.694}
                />
                <skinnedMesh
                    name='Grass007'
                    geometry={nodes.Grass007.geometry}
                    material={material}
                    skeleton={nodes.Grass007.skeleton}
                    position={[2.804, -0.009, -11.357]}
                    rotation={[0, 0.133, 0]}
                    scale={1.904}
                />
                <skinnedMesh
                    name='Grass'
                    geometry={nodes.Grass.geometry}
                    material={material}
                    skeleton={nodes.Grass.skeleton}
                    position={[7.724, -0.143, -12.22]}
                    rotation={[0, 0.133, 0]}
                    scale={2.679}
                />
            </group>
        </group>
    )
}

useGLTF.preload(modelUrl)
