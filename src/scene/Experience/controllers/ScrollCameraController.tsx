import React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const PATH_MODEL_URL = '/example_path_tracking_v1.glb'
const SCROLL_SENSITIVITY = 0.00035
const SCROLL_DAMPING = 6

type CameraPathData = {
    cameraCurve: THREE.CatmullRomCurve3
    lookCurve: THREE.CatmullRomCurve3
    fov?: number
}

type PathPoint = {
    cameraPosition: THREE.Vector3
    targetPosition: THREE.Vector3
    fov?: number
}

function getPointOrder(name: string) {
    const match = name.match(/(\d+)$/)
    return match ? Number(match[1]) : -1
}

function getPathPoints(scene: THREE.Object3D) {
    const pointGroups: THREE.Object3D[] = []

    scene.traverse((object) => {
        if (object.name.startsWith('point_')) {
            pointGroups.push(object)
        }
    })

    pointGroups.sort((left, right) => {
        const orderDifference = getPointOrder(left.name) - getPointOrder(right.name)
        return orderDifference || left.name.localeCompare(right.name)
    })

    return pointGroups.reduce<PathPoint[]>((pathPoints, pointGroup) => {
        let pointCamera: THREE.PerspectiveCamera | null = null
        let pointTarget: THREE.Object3D | null = null

        pointGroup.traverse((object) => {
            if (!pointCamera && object instanceof THREE.PerspectiveCamera) {
                pointCamera = object
            }

            if (!pointTarget && object.name.startsWith('target_')) {
                pointTarget = object
            }
        })

        if (!pointCamera || !pointTarget) {
            console.warn(`Skipping ${pointGroup.name} because it is missing a camera or target child`)
            return pathPoints
        }

        pathPoints.push({
            cameraPosition: pointCamera.getWorldPosition(new THREE.Vector3()),
            targetPosition: pointTarget.getWorldPosition(new THREE.Vector3()),
            fov: pointCamera.fov,
        })

        return pathPoints
    }, [])
}

export default function ScrollCameraController() {
    const { scene } = useGLTF(PATH_MODEL_URL)
    const { camera } = useThree()
    const targetProgress = React.useRef(0)
    const currentProgress = React.useRef(0)
    const nextCameraPosition = React.useRef(new THREE.Vector3())
    const nextLookTarget = React.useRef(new THREE.Vector3())

    const pathData = React.useMemo<CameraPathData | null>(() => {
        scene.updateMatrixWorld(true)

        const pathPoints = getPathPoints(scene)

        if (pathPoints.length < 2) {
            console.warn(`Expected at least 2 point groups, received ${pathPoints.length}`)
            return null
        }

        return {
            cameraCurve: new THREE.CatmullRomCurve3(
                pathPoints.map((point) => point.cameraPosition),
                false,
                'centripetal'
            ),
            lookCurve: new THREE.CatmullRomCurve3(
                pathPoints.map((point) => point.targetPosition),
                false,
                'centripetal'
            ),
            fov: pathPoints[0]?.fov,
        }
    }, [scene])

    React.useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            targetProgress.current = THREE.MathUtils.clamp(
                targetProgress.current + event.deltaY * SCROLL_SENSITIVITY,
                0,
                1
            )
        }

        window.addEventListener('wheel', handleWheel, { passive: true })

        return () => {
            window.removeEventListener('wheel', handleWheel)
        }
    }, [])

    React.useEffect(() => {
        if (!pathData || !(camera instanceof THREE.PerspectiveCamera)) {
            return
        }

        if (pathData.fov !== undefined) {
            camera.fov = pathData.fov
            camera.updateProjectionMatrix()
        }
    }, [camera, pathData])

    useFrame((_, delta) => {
        if (!pathData) {
            return
        }

        currentProgress.current = THREE.MathUtils.damp(
            currentProgress.current,
            targetProgress.current,
            SCROLL_DAMPING,
            delta
        )

        pathData.cameraCurve.getPoint(currentProgress.current, nextCameraPosition.current)
        pathData.lookCurve.getPoint(currentProgress.current, nextLookTarget.current)

        camera.position.copy(nextCameraPosition.current)
        camera.lookAt(nextLookTarget.current)
        camera.updateMatrixWorld()
    })

    return null
}

useGLTF.preload(PATH_MODEL_URL)
