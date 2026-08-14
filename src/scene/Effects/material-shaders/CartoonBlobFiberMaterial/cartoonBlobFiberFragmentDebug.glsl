#include <dithering_fragment>

vec3 surfaceViewNormal = normalize(normal);
float materialLightIntensity = clamp(luma(materialLitResult), 0.0, 1.0);
float depth01 = clamp((vViewPosition.z - cameraNear) / max(10.0 - cameraNear, 0.0001), 0.0, 1.0);

if (useStaticCamera) {
    vec3 staticViewPosition = worldToStaticView(
        vWorldPosition - staticCameraPosition,
        staticCameraPosition,
        staticCameraTarget,
        staticCameraUp
    );
    vec3 surfaceWorldNormal = normalize(vWorldNormal) * (gl_FrontFacing ? 1.0 : -1.0);

    surfaceViewNormal = normalize(
        worldToStaticView(
            surfaceWorldNormal,
            staticCameraPosition,
            staticCameraTarget,
            staticCameraUp
        )
    );

    float shadowTextureValue = clamp(luma(texture(shadowTexture, vSurfaceUv).rgb), 0.0, 1.0);
    materialLightIntensity = clamp(materialLightIntensity - 0.6 * (1.0 - shadowTextureValue), 0.0, 1.0);

    float worldZRange = worldZEnd - worldZStart;
    depth01 = clamp((vWorldPosition.z - worldZStart) / max(abs(worldZRange), 0.0001), 0.0, 1.0);
    if (worldZRange < 0.0) {
        depth01 = 1.0 - depth01;
    }
}

vec3 sampledTextureColor = sampleTexture2DRotated(
    fiberTexture,
    vSurfaceUv,
    max(fiberScale, 0.0001),
    0.0
);
vec3 sampledNoiseColor = sampleTexture2DRotated(
    noiseTexture,
    vSurfaceUv,
    max(noiseScale, 0.0001),
    0.0
);
float noiseValue = clamp(luma(sampledNoiseColor), 0.0, 1.0);

float edge = smoothstep(edgeStart, edgeEnd, (1.0 - abs(surfaceViewNormal.z)) * sampledTextureColor.r);
vec2 projectedNormal = surfaceViewNormal.xy;

float edgeOrientationDegrees = degrees(atan(projectedNormal.y, projectedNormal.x));
if (edgeOrientationDegrees < 0.0) {
    edgeOrientationDegrees += 360.0;
}

float edgeOrientation = edgeOrientationDegrees / 360.0;
if (edge < 0.4) {
    edgeOrientation = 0.0;
    gl_FragColor.rgb = vec3(
        depth01 + edgeOrientation,
        noiseValue,
        floor((materialLightIntensity + sampledTextureColor.r) * 6.0) / 8.0
    );
} else {
    gl_FragColor.rgb = vec3(depth01 + edgeOrientation, noiseValue, 1.0 - edge);
}
