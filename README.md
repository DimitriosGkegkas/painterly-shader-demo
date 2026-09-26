# Metochologio shaders

This repository develops two independently publishable ESM packages and a Vite/R3F demo that consumes them:

-   [`@dimitrisgkegkas/postprocessing`](packages/postprocessing/README.md): `DrawEffect`, `ColorChannelEffect`, and `ShaderEffectComposer` (also exported as `EffectComposer`).
-   [`@dimitrisgkegkas/fiber-material`](packages/fiber-material/README.md): `CartoonBlobFiberMaterial`.

The packages contain compiled GLSL strings and generated TypeScript declarations. Neither depends on React, R3F, Leva, demo asset paths, or a consumer GLSL plugin. Three.js and postprocessing are external peer dependencies, so applications supply their own runtime instances.

## Develop

Use Node 20 or newer (the tools require at least Node 18) and Yarn Classic 1.22.22.

```sh
yarn install --frozen-lockfile
yarn dev                 # demo reads package source directly, including GLSL edits
yarn build               # both libraries, declarations, then production demo
yarn typecheck
yarn test                # builds packages, rendering logic + packed-consumer checks
```

The tested runtime pair is `three@0.174.0` and `postprocessing@6.37.1`. The latter replaces the demo's 6.36.3, whose published Three.js peer range excluded 0.174. Package peer ranges deliberately stay on these minor versions: test newer Three.js shader chunks before widening them.

## Use local edits in another repository

Build once, register each package, then link them into the consumer:

```sh
# From shader-demo
yarn build:packages
(cd packages/postprocessing && yarn link)
(cd packages/fiber-material && yarn link)

cd ~/Work/r3f-metochologio
yarn link @dimitrisgkegkas/postprocessing @dimitrisgkegkas/fiber-material
```

Run `yarn dev:packages` in **shader-demo** while the consumer's dev server is running. This watches both packages and rebuilds their JS and types. The consumer must replace its copied shader implementations with imports from these packages; linking alone does not change its code. No files in that repository are changed by this extraction.

In the consumer's Vite configuration, deduplicate shared runtimes:

```ts
resolve: {
    dedupe: ['three', 'postprocessing', 'react', 'react-dom']
}
```

Restart Vite with `--force` after linking or unlinking. Source GLSL remains inside this repository; consumers import built JavaScript. Shader edits should trigger the linked consumer's reload; restart its dev server if its dependency cache retains old code. For CI/deployment, use installed package versions and commit the consumer lockfile—local links are machine-specific.

## Pack or publish

```sh
yarn test
yarn pack:packages
# artifacts/dimitrisgkegkas-postprocessing-0.1.0.tgz
# artifacts/dimitrisgkegkas-fiber-material-0.1.0.tgz
```

Install these archives directly with `yarn add /absolute/path/to/package.tgz`, or publish each package from its folder:

```sh
cd packages/postprocessing
npm publish
# Then repeat in ../fiber-material
```

The packages use your personal npm scope, `@dimitrisgkegkas`, and package metadata makes public npm access the default. Before publishing, choose a license. `UNLICENSED` currently reserves rights; no open-source license is assumed. `npm pack`/`npm publish` run the package's build via `prepack`; only `dist`, README, and package metadata ship. Keep the repository's source/build tooling in Git for development.

Version the packages independently. Start at `0.1.0`; bump a version before publishing changed code. Pin the versions in consuming applications for reproducible deployments. Both npm and Yarn install these same packages.

## GitHub Actions

[`ci.yml`](.github/workflows/ci.yml) runs lint, type checks, package builds, rendering tests, packed-consumer tests, and the demo production build on every push and pull request. [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) continues to deploy the demo from `main`.

[`publish-npm.yml`](.github/workflows/publish-npm.yml) publishes through npm trusted publishing (OIDC), so the repository does not need a long-lived `NPM_TOKEN`. It can be launched manually from the Actions tab or by publishing a GitHub Release with one of these exact tag formats:

```text
postprocessing-v0.1.0
fiber-material-v0.1.0
```

The version after `v` must equal the corresponding `package.json` version. The workflow validates the whole repository, skips a version already present on npm, and then publishes. npm automatically attaches provenance when trusted publishing's public-repository requirements are met.

Trusted publishing requires one initial setup:

1. Publish each package once manually so its npm package settings page exists.
2. On each npm package page, open **Settings → Trusted Publisher → GitHub Actions**.
3. Enter GitHub owner `DimitriosGkegkas`, repository `painterly-shader-demo`, and workflow filename `publish-npm.yml`.
4. Allow direct `npm publish`. Leave the environment field empty because the workflow does not declare one.

The package `repository.url` values intentionally match `https://github.com/DimitriosGkegkas/painterly-shader-demo`, which npm requires for trusted publishing and provenance. After both trusted publishers are configured, you can restrict or revoke traditional npm write tokens.

## Migration from the demo internals

-   `new EffectComposer(renderer, options)` becomes `new ShaderEffectComposer(renderer, scene, camera, options)`.
-   Pass the paper texture explicitly; the demo adapter still loads its existing image.
-   Material textures are supplied by the application; omitted textures have neutral fallbacks.
-   Removed obsolete draw controls (`thickness`, `scale`, `noisiness`, `fillColor`, `showHatch`, `useNoiseTexture`, `useSketchTexture`) were unused by the active shader. Use `edgeRadius`, `edgeStrength`, `textureStrength`, `paperMidpoint`, `inkColor`, and `outlineColor` instead.
-   Removed material controls `edgeNoiseScale`, `edgeNoiseStrength`, `worldZStart`, and `worldZEnd` were also unused. Depth uses the rendering camera's near/far planes.
-   `inkColor` now actually configures the ink wash. The package default preserves the shader's previously hardcoded brown.
-   The composer does not override renderer color space. Set `renderer.outputColorSpace = SRGBColorSpace` in your application (R3F normally does this already).
