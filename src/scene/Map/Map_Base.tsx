import * as THREE from 'three'
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { GLTF } from 'three-stdlib'
import { HeightMaterial } from '../Effects/Materials/HeightMaterial'
import { LineMaterialM } from '../Effects/Materials/LineMaterialM'

type GLTFResult = GLTF & {
    nodes: {
        Sea: THREE.Mesh
        Terrain_1: THREE.Mesh
        Terrain_2: THREE.Mesh
        Roads: THREE.Mesh
    }
}

export default function Model(props: JSX.IntrinsicElements['group']) {
    const { nodes } = useGLTF('/assets/model/Map/Map_Base_v19-transformed.glb', './draco/') as unknown as GLTFResult
    const terrainMaterial = useMemo(() => new HeightMaterial({}), [])
    const seaMaterial = useMemo(() => new LineMaterialM({}), [])
    const coastMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0.9) }), [])
    const roadsMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0.9) }), [])

    useFrame(({ clock }) => {
        seaMaterial.uniforms.time.value = clock.getElapsedTime()
    })

    return (
        <group {...props} dispose={null}>
            <mesh geometry={nodes.Sea.geometry} material={seaMaterial} position={[-0.108, 5.701, 6.756]} scale={10} />
            <group position={[-0.108, 6.827, 6.752]}>
                <mesh geometry={nodes.Terrain_1.geometry} material={terrainMaterial} />
                <mesh geometry={nodes.Terrain_2.geometry} material={coastMaterial} />
            </group>
            <mesh
                geometry={nodes.Roads.geometry}
                material={roadsMaterial}
                position={[-27.265, 1.165, -33.703]}
                rotation={[-Math.PI, 1.347, -Math.PI]}
            />
        </group>
    )
}

useGLTF.preload('/assets/model/Map/Map_Base_v19-transformed.glb')
