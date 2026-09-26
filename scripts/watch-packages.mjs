import { spawn } from 'node:child_process'

const children = ['postprocessing', 'fiber-material'].map(name =>
    spawn('yarn', ['dev'], { cwd: new URL(`../packages/${name}/`, import.meta.url), stdio: 'inherit' })
)
let stopping = false
function stop(code) {
    if (stopping) return
    stopping = true
    for (const child of children) child.kill('SIGTERM')
    process.exitCode = code
}
for (const child of children) {
    child.on('error', error => {
        console.error(error)
        stop(1)
    })
    child.on('exit', code => stop(code ?? 1))
}
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
