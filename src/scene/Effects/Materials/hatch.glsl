// Function to apply a texture-like hatch pattern based on luminance
// p: Input 2D position (vec2)
// lum: Luminance value (float)
// Returns a value between 0.0 and 1.0 representing the hatch pattern

float texh(in vec2 p, in float noise, in float distance, in float thickness, in int contours) {
    // Compute an edge thickness based on screen-space derivatives to reduce aliasing.
    // float e = 0.0;
    // #ifdef GL_OES_standard_derivatives
      // Calculate the approximate filter width using derivatives
      // dFdx(value) and dFdy(value) compute the rate of change of the value in screen space
    float e = thickness * length(vec2(dFdx(p.x), dFdy(p.y)));
    // #endif  
    

    // Compute the base spacing for the contour lines.
    float spacing = distance / (2.* float(contours));
    
    // Loop through each contour line.
    for (int i = 0; i < contours; i++) {
        // Incorporate noise into the contour offset.
        // Adjust the multiplier (here 0.5) to control the amplitude of the random variation.
        float offset = noise;
        
        // Calculate the position of the i-th contour line along the y axis.
        float linePos = spacing * float(i) + offset;
        
        // Compute the distance from p.y to the contour line (using mod to wrap over distance).
        float v = abs(mod(p.y - linePos, distance));
        
        // If we are within the edge threshold, return 0.0 (line present).
        if (v < e) {
            return 0.0;
        }
    }

    // Otherwise return 1.0 (background).
    return 1.0;
}

float texh_altitude(in float height, in float noise, in float distance, in float thickness, in int contours) {
    // Compute an edge thickness based on screen-space derivatives to reduce aliasing.
    float e = thickness * length(vec2(dFdx(height), dFdy(height)));

    // Compute the base spacing for the contour lines.
    float spacing = distance / (2. * float(contours));
    
    // Loop through each contour line.
    for (int i = 0; i < contours; i++) {
        // Incorporate noise into the contour offset.
        float offset = noise * (-spacing + spacing * 0.5);
        
        // Calculate the position of the i-th contour line along the height axis.
        float linePos = spacing * float(i) + offset;
        
        // Compute the distance from height to the contour line (using mod to wrap over distance).
        float v = abs(mod(height - linePos, distance));
        
        // If we are within the edge threshold, return 0.0 (line present).
        if (v < e) {
            return 0.0;
        }
    }

    // Otherwise return 1.0 (background).
    return 1.0;
}



// Helper function to calculate hatch pattern for each level
float calculateHatchLevel(vec2 uv, float noise, mat2 rotationMatrix, float distance, float thickness, int contours) {
    vec2 rotatedUV = rotationMatrix * uv;

    return texh(rotatedUV, noise, distance, thickness, contours);
}
uniform sampler2D noiseTexture;

// Generates a 3D simplex noise value
// v: Input 3D vector
// Returns a noise value between -1.0 and 1.0
float simplex(in vec3 v) {
    // Sample the noise texture at the given position (v.xy / 32.0)
    // The noise texture provides pseudo-random noise values
    // The result is scaled to the range [-1.0, 1.0]
return 2.0 * texture(noiseTexture, v.xy / 32.0).r - 1.0;
}

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