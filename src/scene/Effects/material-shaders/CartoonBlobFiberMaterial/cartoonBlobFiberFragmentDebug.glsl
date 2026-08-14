#include <dithering_fragment>

vec3 surfaceViewNormal = normalize(normal);
float materialLightIntensity = luma(materialLitResult);
float depth01 = clamp(
    (vViewPosition.z - cameraNear) / max(cameraFar - cameraNear, 0.0001),
    0.0,
    1.0
);

if (useStaticCamera) {
    vec3 surfaceWorldNormal = normalize(vWorldNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    float shadowTextureValue = clamp(luma(texture(shadowTexture, vSurfaceUv).rgb), 0.0, 1.0);
    float lightTextureValue = clamp(luma(texture(lightTexture, vSurfaceUv).rgb), 0.0, 1.0);
    float worldZRange = worldZEnd - worldZStart;

    surfaceViewNormal = normalize(
        worldToStaticView(
            surfaceWorldNormal,
            staticCameraPosition,
            staticCameraTarget,
            staticCameraUp
        )
    );

    materialLightIntensity = clamp(
        materialLightIntensity + shadowTextureValue + lightTextureValue - 1.0,
        0.0,
        1.0
    );

    depth01 = clamp(
        (vWorldPosition.z - worldZStart) / max(abs(worldZRange), 0.0001),
        0.0,
        1.0
    );
    if (worldZRange < 0.0) {
        depth01 = 1.0 - depth01;
    }
}

float fiberValue = sampleTexture2DRotated(
    fiberTexture,
    vSurfaceUv,
    max(fiberScale, 0.0001),
    0.0
).r;
float noiseValue = clamp(
    luma(sampleTexture2DRotated(noiseTexture, vSurfaceUv, max(noiseScale, 0.0001), 0.0)),
    0.0,
    1.0
);

float quantizedLight = materialLightIntensity;
if (bandCount > 1.0) {
    float bandSteps = max(bandCount - 1.0, 1.0);
    float scaledLight = materialLightIntensity * bandSteps;
    float bandFraction = fract(scaledLight);
    float transitionNoise = (fiberValue - 0.5) * bandTextureInfluence;
    float transitionSoftness = max(bandSoftness, 0.0001);
    float blend = smoothstep(
        0.5 - transitionSoftness,
        0.5 + transitionSoftness,
        bandFraction + transitionNoise
    );
    float lowBand = floor(scaledLight) / bandSteps;
    float highBand = ceil(scaledLight) / bandSteps;

    quantizedLight = mix(lowBand, highBand, blend);
}

float edge = smoothstep(edgeStart, edgeEnd, (1.0 - abs(surfaceViewNormal.z)));
float edgeOrientation = fract(atan(surfaceViewNormal.y, surfaceViewNormal.x) / 6.28318530718 + 1.0);
if(abs(surfaceViewNormal.x) < 0.0001 && abs(surfaceViewNormal.y) < 0.0001) {
    edgeOrientation = 0.0;
}
gl_FragColor.rgb = vec3(depth01 +  edge * edgeOrientation, noiseValue, quantizedLight - edge);
