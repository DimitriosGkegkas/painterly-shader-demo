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

    surfaceViewNormal = normalize(staticViewMatrix * surfaceWorldNormal);
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

float noiseValue = clamp(
    luma(texture(noiseTexture, (vSurfaceUv - 0.5) * max(noiseScale, 0.0001) + 0.5).rgb),
    0.0,
    1.0
);

float quantizedLight = materialLightIntensity;
if (bandCount > 1.0) {
    float fiberValue = 0.5;
    if (bandTextureInfluence != 0.0) {
        fiberValue = texture(fiberTexture, (vSurfaceUv - 0.5) * max(fiberScale, 0.0001) + 0.5).r;
    }
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

// Offset moves full edge coverage from the silhouette (0) to the center (1).
// Smoothness is the width of the fade leading up to that point.
float edgeEnd = 1.0 - clamp(edgeOffset, 0.0, 1.0);
float edgeWidth = clamp(edgeSmoothness, 0.0, 1.0);
float edgeStart = edgeEnd - edgeWidth;
float edgeFacing = 1.0 - abs(surfaceViewNormal.z);
float edge = 0.0;
if (!disableEdgeNormals) {
    // A zero-width fade is a hard edge; avoid equal smoothstep bounds.
    edge = edgeWidth > 0.0
        ? smoothstep(edgeStart, edgeEnd, edgeFacing)
        : step(edgeEnd, edgeFacing);
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

// Full edge coverage is dark regardless of the lighting intensity.
float edgeLight = edgeFacing >= edgeEnd
    ? 0.0
    : quantizedLight - edge;

gl_FragColor.rgb = vec3(depth01 + 2.0 * orientation, noiseValue, edgeLight);
