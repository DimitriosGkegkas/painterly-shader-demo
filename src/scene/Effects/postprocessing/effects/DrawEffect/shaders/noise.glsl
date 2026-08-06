uniform sampler2D noiseTexture;
uniform sampler2D borderNoiseTexture;
uniform bool useNoiseTexture;
uniform bool useSketchTexture;

// Generates a 3D simplex noise value
// v: Input 3D vector
// Returns a noise value between -1.0 and 1.0
float simplex(in vec3 v) {
    if(!useNoiseTexture) {
        return 0.0;
    }
    // Sample the noise texture at the given position (v.xy / 32.0)
    // The noise texture provides pseudo-random noise values
    // The result is scaled to the range [-1.0, 1.0]
    return 2.0 * texture(noiseTexture, v.xy / 32.0).r - 1.0;
}

float simplexBoarder(in vec3 v) {
    if(!useSketchTexture) {
        return 0.0;
    }
    // Sample the noise texture at the given position (v.xy / 32.0)
    // The noise texture provides pseudo-random noise values
    // The result is scaled to the range [-1.0, 1.0]
    float luminance = luma(texture(borderNoiseTexture, v.xy / 32.0).rgb);
    return 2.0 * luminance - 1.0;
}

// Fractal Brownian Motion (FBM) with 3 octaves
// v: Input 3D vector
// Returns a value that combines multiple layers (octaves) of simplex noise
float fbm3(vec3 v) {
    // Initialize the result with the first octave of simplex noise
    float result = simplex(v);

    // Add the second octave of noise, scaled down by 1/2
    result += simplex(v * 2.0) / 2.0;

    // Add the third octave of noise, scaled down by 1/4
    result += simplex(v * 4.0) / 4.0;

    // Normalize the result to keep the output in a consistent range
    // The normalization factor is the sum of the amplitudes: 1 + 1/2 + 1/4
    result /= (1.0 + 1.0 / 2.0 + 1.0 / 4.0);

    // Return the final FBM result
    return result;
}

// Fractal Brownian Motion (FBM) with 5 octaves
// v: Input 3D vector
// Similar to fbm3, but with more octaves for added detail
float fbm5(vec3 v) {
    float result = simplex(v);
    result += simplex(v * 2.0) / 2.0;
    result += simplex(v * 4.0) / 4.0;
    result += simplex(v * 8.0) / 8.0;
    result += simplex(v * 16.0) / 16.0;

    // Normalize the result to keep the output in a consistent range
    // The normalization factor is the sum of the amplitudes: 1 + 1/2 + 1/4 + 1/8 + 1/16
    result /= (1.0 + 1.0 / 2.0 + 1.0 / 4.0 + 1.0 / 8.0 + 1.0 / 16.0);

    return result;
}
