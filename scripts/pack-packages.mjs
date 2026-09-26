import { mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const destination = fileURLToPath(new URL('../artifacts/', import.meta.url))
mkdirSync(destination, { recursive: true })
for (const name of ['postprocessing', 'fiber-material']) {
    // Root command already built both packages; avoid running prepack a second time.
    execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', destination], {
        cwd: new URL(`../packages/${name}/`, import.meta.url),
        stdio: 'inherit',
        env: { ...process.env, npm_config_cache: process.env.npm_config_cache ?? '/tmp/shader-demo-npm-cache' },
    })
}
