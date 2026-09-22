/*
 * Metohologio V3 scene generated from the explicit glTF hierarchy in
 * MetohologioSceneV3-test.tsx. Project-specific fiber materials are applied
 * to each rendered mesh while preserving the original rig and animations.
 */

import * as THREE from 'three'
import React, { useMemo } from 'react'
import { useGraph } from '@react-three/fiber'
import { useAnimations, useGLTF, useTexture } from '@react-three/drei'
import { GLTF, SkeletonUtils } from 'three-stdlib'
import { CartoonBlobFiberMaterial } from '../Effects/material-shaders/CartoonBlobFiberMaterial'
import { assetUrl } from '../../utils/assetUrl.js'

type ActionName = 'Walk' | 'Armature.004Action' | 'Armature.004Action.001' | 'Action.004' | 'Action.005' | 'Armature.004Action.004' | 'Armature.004Action.005' | 'Armature.004|Armature.002Action.002' | 'Armature.004|Armature.004Action.002' | 'Armature.005|Armature|3030509026704_TempMotion|3030509026704_Te' | 'Armature|3030509026704_TempMotion|3030509026704_TempMotion.001' | 'Armature|3030509026704_TempMotion|3030509026704_TempMotion.004' | 'Action.006'

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName
}

type GLTFResult = GLTF & {
  nodes: {
    Large_Sheep: THREE.SkinnedMesh
    Small_Sheep: THREE.SkinnedMesh
    Barrel: THREE.Mesh
    Ground: THREE.Mesh
    Wall: THREE.Mesh
    Cube: THREE.Mesh
    Beard: THREE.SkinnedMesh
    Priest_body_lod0_mesh: THREE.SkinnedMesh
    Grass: THREE.SkinnedMesh
    Grass001: THREE.SkinnedMesh
    Grass002: THREE.SkinnedMesh
    Grass003: THREE.SkinnedMesh
    Grass004: THREE.SkinnedMesh
    Grass005: THREE.SkinnedMesh
    Grass006: THREE.SkinnedMesh
    Grass007: THREE.SkinnedMesh
    root: THREE.Bone
    ['MCH-torsoparent']: THREE.Bone
    ['MCH-hand_ikparentL']: THREE.Bone
    ['MCH-upper_arm_ik_targetparentL']: THREE.Bone
    ['MCH-hand_ikparentR']: THREE.Bone
    ['MCH-upper_arm_ik_targetparentR']: THREE.Bone
    ['MCH-eye_commonparent']: THREE.Bone
    ['MCH-foot_ikparentL']: THREE.Bone
    ['MCH-thigh_ik_targetparentL']: THREE.Bone
    ['MCH-foot_ikparentR']: THREE.Bone
    ['MCH-thigh_ik_targetparentR']: THREE.Bone
    ['MCH-lip_armBL001']: THREE.Bone
    ['MCH-lip_armBR001']: THREE.Bone
    ['MCH-lip_armTL001']: THREE.Bone
    ['MCH-lip_armTR001']: THREE.Bone
    Bone: THREE.Bone
    Bone_1: THREE.Bone
    Bone_2: THREE.Bone
    Bone_3: THREE.Bone
    Bone_4: THREE.Bone
    Bone_5: THREE.Bone
    Bone_6: THREE.Bone
    Bone_7: THREE.Bone
    RL_BoneRoot: THREE.Bone
    RL_BoneRoot_1: THREE.Bone
  }
  animations: GLTFAction[]
}

const modelUrl = assetUrl(
  'assets/model/Map/Metohologio_example scene_v3-transformed.glb'
)

export default function MetohologioSceneV3(
  props: JSX.IntrinsicElements['group']
) {
  const group = React.useRef<THREE.Group>(null)
  const groundShadowTexture = useTexture(assetUrl('ground-path-inverted.png'))
  const { scene, animations } = useGLTF(modelUrl)
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes } = useGraph(clone) as unknown as GLTFResult
  const { actions } = useAnimations(animations, group)

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

  React.useEffect(() => {
    const activeActions = Object.values(actions)
    activeActions.forEach((action) => action?.reset().play())

    return () => {
      activeActions.forEach((action) => action?.stop())
    }
  }, [actions])

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="rig">
          <primitive object={nodes.root} />
          <primitive object={nodes['MCH-torsoparent']} />
          <primitive object={nodes['MCH-hand_ikparentL']} />
          <primitive object={nodes['MCH-upper_arm_ik_targetparentL']} />
          <primitive object={nodes['MCH-hand_ikparentR']} />
          <primitive object={nodes['MCH-upper_arm_ik_targetparentR']} />
          <primitive object={nodes['MCH-eye_commonparent']} />
          <primitive object={nodes['MCH-foot_ikparentL']} />
          <primitive object={nodes['MCH-thigh_ik_targetparentL']} />
          <primitive object={nodes['MCH-foot_ikparentR']} />
          <primitive object={nodes['MCH-thigh_ik_targetparentR']} />
          <primitive object={nodes['MCH-lip_armBL001']} />
          <primitive object={nodes['MCH-lip_armBR001']} />
          <primitive object={nodes['MCH-lip_armTL001']} />
          <primitive object={nodes['MCH-lip_armTR001']} />
        </group>
        <group name="Grass_Armature" position={[7.724, -0.143, -12.22]} rotation={[0, 0.133, 0]} scale={2.679}>
          <primitive object={nodes.Bone} />
        </group>
        <group name="Grass_Armature001" position={[1.069, -0.023, -0.465]} rotation={[0, 0.133, 0]} scale={2.502}>
          <primitive object={nodes.Bone_1} />
        </group>
        <group name="Grass_Armature002" position={[3.195, -0.023, -11.633]} rotation={[0, 0.133, 0]} scale={2.679}>
          <primitive object={nodes.Bone_2} />
        </group>
        <group name="Grass_Armature003" position={[0.189, -0.052, 0.251]} rotation={[0, 0.133, 0]} scale={1.389}>
          <primitive object={nodes.Bone_3} />
        </group>
        <group name="Grass_Armature004" position={[3.76, 0.033, -11.568]} rotation={[0, 0.133, 0]} scale={4.825}>
          <primitive object={nodes.Bone_4} />
        </group>
        <group name="Grass_Armature005" position={[3.471, 0.065, -12.207]} rotation={[0, 0.672, 0]} scale={6.152}>
          <primitive object={nodes.Bone_5} />
        </group>
        <group name="Grass_Armature006" position={[2.596, 0.005, -11.713]} rotation={[0, 0.672, 0]} scale={3.694}>
          <primitive object={nodes.Bone_6} />
        </group>
        <group name="Grass_Armature007" position={[2.804, -0.009, -11.357]} rotation={[0, 0.133, 0]} scale={1.904}>
          <primitive object={nodes.Bone_7} />
        </group>
        <group name="Large_Sheep_Armature" position={[3.36, -0.037, 3.251]} rotation={[0, -1.415, 0]} scale={1.13}>
          <primitive object={nodes.RL_BoneRoot} />
          <skinnedMesh name="Large_Sheep" castShadow receiveShadow geometry={nodes.Large_Sheep.geometry} material={material} skeleton={nodes.Large_Sheep.skeleton} />
        </group>
        <group name="Small_Sheep_Armature" position={[3.301, -0.1, 3.002]} rotation={[0, -0.625, 0]} scale={0.637}>
          <primitive object={nodes.RL_BoneRoot_1} />
          <skinnedMesh name="Small_Sheep" castShadow receiveShadow geometry={nodes.Small_Sheep.geometry} material={material} skeleton={nodes.Small_Sheep.skeleton} />
        </group>
        <mesh name="Barrel" castShadow receiveShadow geometry={nodes.Barrel.geometry} material={material} position={[3.226, -0.004, -11.089]} scale={0.555} />
        <mesh name="Ground" castShadow receiveShadow geometry={nodes.Ground.geometry} material={groundMaterial} position={[0, -0.848, 0.267]} scale={1.811} />
        <mesh name="Wall" castShadow receiveShadow geometry={nodes.Wall.geometry} material={new THREE.MeshStandardMaterial()} />
        <mesh name="Cube" castShadow receiveShadow geometry={nodes.Cube.geometry} material={material} scale={[0.052, 0.674, 0.06]} />
        <skinnedMesh name="Beard" castShadow receiveShadow geometry={nodes.Beard.geometry} material={material} skeleton={nodes.Beard.skeleton} />
        <skinnedMesh name="Priest_body_lod0_mesh" castShadow receiveShadow geometry={nodes.Priest_body_lod0_mesh.geometry} material={material} skeleton={nodes.Priest_body_lod0_mesh.skeleton} />
        <skinnedMesh name="Grass" castShadow receiveShadow geometry={nodes.Grass.geometry} material={material} skeleton={nodes.Grass.skeleton} position={[7.724, -0.143, -12.22]} rotation={[0, 0.133, 0]} scale={2.679} />
        <skinnedMesh name="Grass001" castShadow receiveShadow geometry={nodes.Grass001.geometry} material={material} skeleton={nodes.Grass001.skeleton} position={[1.069, -0.023, -0.465]} rotation={[0, 0.133, 0]} scale={2.502} />
        <skinnedMesh name="Grass002" castShadow receiveShadow geometry={nodes.Grass002.geometry} material={material} skeleton={nodes.Grass002.skeleton} position={[3.195, -0.023, -11.633]} rotation={[0, 0.133, 0]} scale={2.679} />
        <skinnedMesh name="Grass003" castShadow receiveShadow geometry={nodes.Grass003.geometry} material={material} skeleton={nodes.Grass003.skeleton} position={[0.189, -0.052, 0.251]} rotation={[0, 0.133, 0]} scale={1.389} />
        <skinnedMesh name="Grass004" castShadow receiveShadow geometry={nodes.Grass004.geometry} material={material} skeleton={nodes.Grass004.skeleton} position={[3.76, 0.033, -11.568]} rotation={[0, 0.133, 0]} scale={4.825} />
        <skinnedMesh name="Grass005" castShadow receiveShadow geometry={nodes.Grass005.geometry} material={material} skeleton={nodes.Grass005.skeleton} position={[3.471, 0.065, -12.207]} rotation={[0, 0.672, 0]} scale={6.152} />
        <skinnedMesh name="Grass006" castShadow receiveShadow geometry={nodes.Grass006.geometry} material={material} skeleton={nodes.Grass006.skeleton} position={[2.596, 0.005, -11.713]} rotation={[0, 0.672, 0]} scale={3.694} />
        <skinnedMesh name="Grass007" castShadow receiveShadow geometry={nodes.Grass007.geometry} material={material} skeleton={nodes.Grass007.skeleton} position={[2.804, -0.009, -11.357]} rotation={[0, 0.133, 0]} scale={1.904} />
      </group>
    </group>
  )
}

useGLTF.preload(modelUrl)
