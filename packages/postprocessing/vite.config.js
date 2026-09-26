import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
    root,
    publicDir: false,
    plugins: [
        {
            name: 'package-types',
            writeBundle() {
                execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.json'], {
                    cwd: root,
                    stdio: 'inherit',
                })
            },
        },
    ],
    build: {
        target: 'es2020',
        lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'index.js' },
        rollupOptions: { external: ['three', 'postprocessing'] },
        minify: false,
    },
})
