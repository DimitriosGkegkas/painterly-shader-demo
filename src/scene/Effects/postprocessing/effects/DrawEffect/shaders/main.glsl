precision highp float;

// Anti-aliased step function to provide smooth transitions
// threshold: The cutoff value where the step occurs
// value: The input value to compare against the threshold
float aastep(float threshold, float value) {
    // Check if the standard derivatives extension is available
    #ifdef GL_OES_standard_derivatives
      // Calculate the approximate filter width using derivatives
      // dFdx(value) and dFdy(value) compute the rate of change of the value in screen space
    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;  // 1/sqrt(2)

      // Use smoothstep to provide a gradual transition between 0 and 1
      // The transition width is adjusted by the calculated filter width
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
    #else
      // Fallback to a regular step function if derivatives are not available
    return step(threshold, value);
    #endif  
}

uniform sampler2D normalBuffer;
uniform sampler2D paperTexture;
uniform sampler2D selectedFBO;
uniform vec3 inkColor;
uniform vec2 edgeViewportSize;
uniform float scale;
uniform float noisiness;
uniform bool usePaperTexture;

// // Helper function to calculate the UV offset for each level
// vec2 calculateUVOffset(vec2 vUv, float scale, float noisiness, float level, float totalLevels) {
//     float ss = scale * mix(1.0, 4.0, level / totalLevels);
//     vec2 offset = noisiness * vec2(fbm3(vec3(ss * vUv, 1.0)), fbm3(vec3(ss * vUv.yx, 1.0)));
//     return vUv + offset;
// }

// Helper function to calculate the UV offset for each level
vec2 getOffset(vec2 vUv, float scale, float noisiness, float level, float totalLevels) {
    float ss = scale * mix(1.0, 4.0, level / totalLevels);
    vec2 offset = noisiness * vec2(fbm3(vec3(ss * vUv, 1.0)), fbm3(vec3(ss * vUv.yx, 1.0)));
    return offset;
}

float getAppear(vec2 vUv) {
    float noise = useSketchTexture ? simplexBoarder(vec3(50.0 * vUv, 1.0)) : 0.0;
    vec2 tmp = vUv;
    tmp.x = vUv.x + 0.1 * noise - 0.06;
    tmp.y = vUv.y + 0.1 * noise - 0.09;
    return smoothstep(0.01, 0.02, distanceFromCanvasBorder(tmp));
}

void mainImage(const in vec4 inputColor, const in vec2 vUv, out vec4 fragColor) {
    // Apply final blending with paper texture and ink color
    vec4 paper = usePaperTexture ? texture(paperTexture, vUv) : vec4(1.0);

    // Texture strength controls grain; inkMask controls how densely the color builds up.
    float textureStrength = 10.0;
    float paperMidpoint = 0.734; // Approximate average sRGB brightness of Craft_Light.jpg.
    // RGB swatch values are sRGB: decode them before blending in linear RGB.
    vec3 washColorSRGB = vec3(0.51, 0.22, 0.05);
    vec3 finalInk = srgbToLinearExact(washColorSRGB);
    vec3 outlineColor = vec3(0.0);

    float inkMask = clamp(1.0 - inputColor.b, 0.0, 1.0);
    // Five density levels, including bare paper (0) and full ink (1).
    // float inkBandCount = 5.0;
    // float inkBandSteps = max(inkBandCount - 1.0, 1.0);
    // inkMask = round(inkMask * inkBandSteps) / inkBandSteps;

    vec3 texturedInk = getTextureInk(
        paper.rgb, finalInk, usePaperTexture ? textureStrength : 0.0, paperMidpoint, inkMask
    );

    fragColor.rgb = texturedInk;
    fragColor.a = 1.0;

    vec2 offsetUV = vUv + vec2(-0.003, -0.005);
    float edgeIntensity = sampleEdgeSignal(inputBuffer, offsetUV);

    // make edgeIntensity from 0.0 to 1.0 
    edgeIntensity = clamp(edgeIntensity, 0.0, 1.0);

    float edgeRadiusCSS = 0.1;
    float edgeThreshold = 0.3; // Signal change per CSS pixel.
    float edgeSoftness = 0.9;
    float edgeAcc = edgeIntensity * sobelFloatSmooth(
        inputBuffer, offsetUV, edgeViewportSize, edgeRadiusCSS, edgeThreshold, edgeSoftness
    );
    // Dark pen outlines are independent of the translucent brown wash.
    fragColor.rgb = mix(fragColor.rgb, outlineColor, clamp(edgeAcc, 0.0, 1.0));

    
}
