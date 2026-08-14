#include <dithering_fragment>

vec3 surfaceViewNormal = normalize(normal);
float materialLightIntensity = luma(materialLitResult);
float depth01 = clamp(
    (vViewPosition.z - cameraNear) / max(cameraFar - cameraNear, 0.0001),
    0.0,
    1.0
);

float orientation = 0.0;
vec3 n = normalize(surfaceViewNormal);


if (useStaticCamera) {
    vec3 surfaceWorldNormal = normalize(vWorldNormal) * (gl_FrontFacing ? 1.0 : -1.0);
    float shadowTextureValue = clamp(luma(texture(shadowTexture, vSurfaceUv).rgb), 0.0, 1.0);
    float worldZRange = worldZEnd - worldZStart;

    surfaceViewNormal = normalize(
        worldToStaticView(
            surfaceWorldNormal,
            staticCameraPosition,
            staticCameraTarget,
            staticCameraUp
        )
    );
    n = normalize(surfaceViewNormal);

    materialLightIntensity = clamp(
        materialLightIntensity + shadowTextureValue - 1.0,
        0.0,
        1.0
    );
}

if (disableEdgeNormals) {
    surfaceViewNormal = vec3(0.0, 0.0, 1.0);

    n = normalize(vWorldNormal);

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

float theta = atan(n.z, n.x); // -PI .. PI
if (n.x < 0.001 && n.z < 0.001) {
    theta = 0.0;
}
float phi   = asin(n.y);      // -PI/2 .. PI/2
theta = abs(theta); // 0 .. PI
phi   = abs(phi);   // 0 .. PI/2
float theta01 = abs(theta) / PI;
float phi01   = abs(phi) / (PI * 0.5);

orientation = 2.0 * theta01 + phi01;

gl_FragColor.rgb = vec3(depth01 + 2.0 * orientation, noiseValue, quantizedLight - edge);
