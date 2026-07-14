import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import OpacityMaterial from '../Effects/Materials/OpacityMaterial'

// Helper: Applies vertex colors to a geometry.
function applyVertexColors(geometry, color) {
    const { count } = geometry.attributes.position
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

// Helper: Clones, colors, and merges geometries from a list of node keys.
function mergeAndColorGeometries(nodes, nodeKeys, colorMap) {
    try {
        const geometries = nodeKeys.map((key, index) => {
            const geo = nodes[key].geometry.clone()
            applyVertexColors(geo, colorMap[index])
            return geo
        })

        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true)
        return new THREE.Mesh(
            mergedGeometry,
            new OpacityMaterial({
                vertexColors: true,
                side: THREE.DoubleSide,
            })
        )
    } catch (e) {
        console.log(nodeKeys)
        console.log(nodeKeys, nodes)
        console.log(nodeKeys, e)
    }
}

function mergeGeometries(nodes, nodeKeys, material) {
    try {
        const geometries = nodeKeys.map((key, index) => {
            const geo = nodes[key].geometry.clone()
            return geo
        })
        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, true)
        return new THREE.Mesh(
            mergedGeometry,
            material
        )
    } catch (e) {
        console.log(nodeKeys, nodes)
        console.log(nodeKeys, e)
    }
}
export { applyVertexColors, mergeAndColorGeometries, mergeGeometries }
