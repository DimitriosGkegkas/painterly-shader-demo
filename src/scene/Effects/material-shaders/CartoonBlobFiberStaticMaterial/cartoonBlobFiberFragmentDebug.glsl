#include <dithering_fragment>

vec3 staticViewPosition = worldToStaticView(
    vWorldPosition - staticCameraPosition,
    staticCameraPosition,
    staticCameraTarget,
    staticCameraUp
);
vec3 surfaceWorldNormal = normalize(vWorldNormal) * (gl_FrontFacing ? 1.0 : -1.0);
vec3 surfaceViewNormal = normalize(
    worldToStaticView(
        surfaceWorldNormal,
        staticCameraPosition,
        staticCameraTarget,
        staticCameraUp
    )
);
vec3 cameraDirection = normalize(staticViewPosition);

float materialLightIntensity = clamp(luma(materialLitResult), 0.0, 1.0);
float shadowTextureValue = clamp(luma(texture(shadowTexture, vSurfaceUv).rgb), 0.0, 1.0);
materialLightIntensity = clamp(materialLightIntensity - 0.6*shadowTextureValue, 0.0, 1.0);
float materialLightDarkness = 1.0 - materialLightIntensity;
float shadowShade = mix(1.0 - shadowStrength, 1.0, materialLightIntensity);

float cameraDistance = length(staticViewPosition);
float worldZRange = worldZEnd - worldZStart;
float depth01 = clamp((vWorldPosition.z - worldZStart) / max(abs(worldZRange), 0.0001), 0.0, 1.0);
if (worldZRange < 0.0) {
    depth01 = 1.0 - depth01;
}


// gl_FragColor.rgb = vec3(edgeOrientation);
// gl_FragColor.rgb = vec3(edge);
// gl_FragColor.rgb = vec3(materialLightIntensity);
// gl_FragColor.rgb = vec3(depth01,edgeOrientation,materialLightIntensity);
vec3 sampledTextureColor = sampleTexture2DRotated(
    fiberTexture,
    vSurfaceUv,
    max(fiberScale, 0.0001),
    0.0
);

vec3 textureVector = vec3(
    sampledTextureColor.r * surfaceViewNormal.x,
    sampledTextureColor.g * surfaceViewNormal.y,
    sampledTextureColor.b * surfaceViewNormal.z
);

// float edgeNoise = (fbm3(vWorldPosition * edgeNoiseScale + vec3(0.0, time * 0.3, time * 0.18)) * 2.0 - 1.0) * edgeNoiseStrength;
float edge = smoothstep(edgeStart, edgeEnd, (1.0 - abs(surfaceViewNormal.z)) * (sampledTextureColor.r ));
// edge = edge * smoothstep(0.46, 0.48,  (sampledTextureColor.r ));

vec2 projectedNormal = surfaceViewNormal.xy;
float projectedNormalLength = length(projectedNormal);

float edgeOrientationDegrees = degrees(atan(projectedNormal.y, projectedNormal.x));
if (edgeOrientationDegrees < 0.0) {
    edgeOrientationDegrees += 360.0;
}
float edgeOrientation = edgeOrientationDegrees / 360.0;
if (edge < 0.4) {
    edgeOrientation = 0.0;
    gl_FragColor.rgb = vec3(depth01, 0.0, floor(materialLightIntensity * 6.0 + 3.0*sampledTextureColor.r) / 5.0) * shadowShade;
}
else {
    gl_FragColor.rgb = vec3(depth01, 0.0, 1.0 - edge) * shadowShade;
}
