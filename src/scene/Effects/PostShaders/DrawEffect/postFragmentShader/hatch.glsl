// Function to apply a texture-like hatch pattern based on luminance
// p: Input 2D position (vec2)
// lum: Luminance value (float)
// Returns a value between 0.0 and 1.0 representing the hatch pattern
float texh(in vec2 p, in float lum, in float thickness, in float level) {
    // Calculate an edge thickness value based on screen-space derivatives
    // This ensures smooth transitions and reduces aliasing
    float e = thickness * length(vec2(dFdx(p.x), dFdy(p.y)));
    // e = 2.;

    float fold = float(int(lum * 30.0 + 5.0));
    float offsetBaseOnLevel = level * float(int(lum * 30.0 + 5.0));

    if(lum < 0.75) {
        // Create a hatch pattern with a period of 32 units along the y-axis
        float v = abs(mod(p.y + offsetBaseOnLevel, fold));

        // If the position falls within the thickness range, return 0.0 (black line)
        if(v < e) {
            return 0.0;
        }
    }

    // First hatch condition: Applies when the luminance is less than 0.5
    if(lum < 0.5) {
        // Create a hatch pattern with a period of 16 units along the y-axis
        float v = abs(mod(p.y + 1.0, 16.0));

        // If the position falls within the thickness range, return 0.0 (black line)
        if(v < e) {
            return 0.0;
        }
    }

    // Second hatch condition: Applies when the luminance is less than 0.25
    if(lum < 0.25) {
        // Create a finer hatch pattern with a period of 8 units along the y-axis
        float v = abs(mod(p.y, 8.0));

        // If the position falls within the thickness range, return 0.0 (black line)
        if(v < e) {
            return 0.0;
        }
    }

    // Return 1.0 for areas that are not covered by hatch lines (white background)
    return 1.0;
}

// Helper function to calculate hatch pattern for each level
float calculateHatchLevel(vec2 uv, mat2 rotationMatrix, float luma, vec2 size, float thickness, int level) {
    vec2 rotatedUV = rotationMatrix * uv;
    vec2 uvLineOffset = (rotatedUV + float(level) * vec2(0.005)) * size;

    return texh(uvLineOffset, luma, 10.0 * (1.0 - luma) * thickness + 0.2, (3.0 * round(luma * fLEVELS)) / float(level));
}
