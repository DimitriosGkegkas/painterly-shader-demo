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
uniform float scale;
uniform float thickness;
uniform float noisiness;
uniform float angle;
uniform float iTime;  // Current time in seconds
uniform float fillColor;

uniform bool showHatch;
uniform bool showEdge;
uniform bool showColor;
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

// The main loop logic
void applyMultiLayerEffect(const in vec2 vUv, const in vec4 inputColor, out float colorAcc) {
    float luma = inputColor.b;
    // colorAcc = quantizeLuma(luma, fLEVELS);
    colorAcc = luma; // removed quantizeLuma

    // mat2 rotationMatrix = getRotationMatrix(quantizedLuma, angle);
    // int level = int(round(quantizedLuma * fLEVELS));
    // vec2 uvOffset = vUv;
    // float hatchEffect = calculateHatchLevel(uvOffset, rotationMatrix, quantizedLuma, vec2(textureSize(inputBuffer, 0)), thickness, level);
    // hatchAcc += 1.0 - hatchEffect;
    float noise = 1.0;
    if(useSketchTexture) {
        noise = simplexBoarder(vec3(100.0 * vUv, 1.0));
        noise = smoothstep(0.5 - luma, 1., noise);
    }
    if(colorAcc > 0.99 && inputColor.g < 0.05) {
        colorAcc = 1.0;
    } else {
        colorAcc = mix(0.0, colorAcc, noise);
    }
}

float getAppear(vec2 vUv) {
    float noise = useSketchTexture ? simplexBoarder(vec3(50.0 * vUv, 1.0)) : 0.0;
    vec2 tmp = vUv;
    tmp.x = vUv.x + 0.1 * noise - 0.06;
    tmp.y = vUv.y + 0.1 * noise - 0.09;
    return smoothstep(0.01, 0.02, distanceFromCanvasBorder(tmp));
}
vec3 palette[6] = vec3[](vec3(0.1765, 0.102, 0.0549),           // Black
vec3(0.3725, 0.1137, 0.0275),  // Deep Brown
vec3(0.5647, 0.4863, 0.3451),  // Warm Gold
vec3(0.2039, 0.2902, 0.2118),  // Deep Green
vec3(0.2157, 0.2588, 0.2941),  // Dark Grayish Blue
vec3(0.0, 0.2, 0.8)           // Deep Blue
);

vec3 getColorFromPalette(float value) {
    // Clamp value to [0,1] range
    value = clamp(value, 0.0, 1.0);

    // Scale to fit within palette indices
    float scaledValue = value * float(5); // 9 because we have 10 colors (index range 0-9)

    // Get lower and upper indices
    int idx1 = int(floor(scaledValue));
    int idx2 = min(idx1 + 1, 9); // Ensure we don't go out of bounds

    // Compute interpolation factor
    float mixFactor = fract(scaledValue);

    // Mix the two colors
    return mix(palette[idx1], palette[idx2], mixFactor);
}

// Main fragment shader function
void mainImage(const in vec4 inputColor, const in vec2 vUv, out vec4 fragColor) {
    vec2 size = vec2(textureSize(inputBuffer, 0));
    // Apply final blending with paper texture and ink color
    vec4 paper = usePaperTexture ? texture(paperTexture, vUv * 0.5) : vec4(1.0);

    // Set final ink color based on the selected region
    vec3 selected = texture(selectedFBO, vUv).rgb;
    // finalInk = vec3(78/255, 39/255, 3/255);
    vec3 finalInk = inkColor;

    finalInk = getColorFromPalette(inputColor.g);
    // finalInk = hsl2rgb(vec3(inputColor.g, 0.5, 1.0 - inputColor.b));
    if(inputColor.r > 0.9)
        finalInk = mix(finalInk, vec3(0.5529, 0.0549, 0.0549), inputColor.r);

    // Initialize accumulators for edge detection, color, and hatching effects
    float colorAcc = 0.0;
    float hatchAcc = 1.0;
    float edgeAcc = 0.0;

    // Apply noise-based UV offset
    vec2 uvOffset = getOffset(vUv, scale, noisiness, 1.0, 1.0);

    float appearEdge = getAppear(vUv);
    float appearColor = appearEdge;
    vec4 colorWithNoise = texture(inputBuffer, vUv + 1. * uvOffset);

    // Apply the multi-layered effect
    applyMultiLayerEffect(vUv + 10. * uvOffset, inputColor * 0.9 + colorWithNoise * 0.1, colorAcc);

    fragColor.rgb = paper.rgb;

    if(inputColor.r > 0.05)
        edgeAcc = sobelFloatSmooth(inputBuffer, vUv, size, .5,
        0.2,
        0.15
        );


    if(showEdge) {
        fragColor.rgb = blend(fragColor.rgb, finalInk, edgeAcc * appearEdge);
    }

    if(showColor) {
        fragColor.rgb = blendDarken(fragColor.rgb, finalInk, max((colorAcc + selected.r * 0.4) * appearColor, 0.0));
    }

    fragColor.a = 1.0;
    fragColor.rgb = srgbToLinear(fragColor.rgb, 2.2);
}
