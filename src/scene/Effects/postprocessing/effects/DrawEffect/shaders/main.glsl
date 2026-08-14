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
    vec2 size = vec2(textureSize(inputBuffer, 0));
    // Apply final blending with paper texture and ink color
    vec4 paper = usePaperTexture ? texture(paperTexture, vUv * 0.5) : vec4(1.0);

    // Set final ink color based on the selected region
    vec3 finalInk = inkColor;
    finalInk = vec3(0.0, 0., 0.0); // Dark brown color for ink

    

    float appearColor = getAppear(vUv);


    fragColor.rgb = paper.rgb;
    fragColor.a = 1.0;

    vec2 offsetUV = vUv + vec2(-0.003, -0.005);
    float edgeIntensity = texture(inputBuffer, offsetUV).g;

    // make edgeIntensity from 0.0 to 1.0 
    edgeIntensity = clamp(edgeIntensity, 0.0, 1.0);
    
    // Add edge detection

float inkMask = clamp(1.0 - inputColor.b, 0.0, 1.0);
vec3 low = 2.0 * fragColor.rgb * finalInk;
vec3 high = 1.0 - 4.0 * (1.0 - fragColor.rgb) * (1.0 - finalInk);
vec3 texturedInk = mix(low, high, step(0.5, fragColor.rgb));
fragColor.rgb = mix(fragColor.rgb, texturedInk, inkMask);


    float edgeAcc = edgeIntensity * sobelFloatSmooth(inputBuffer, offsetUV, size, 1., 0.2, 0.1);
    fragColor.rgb = blend(fragColor.rgb, finalInk, edgeAcc); 

    fragColor.rgb = srgbToLinear(fragColor.rgb, 2.2);
}
