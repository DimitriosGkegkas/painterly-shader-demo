
// Calculates the distance from a given UV coordinate to the center of the surface
// vUv: UV coordinate (vec2), typically in the range [0.0, 1.0]
// Returns the Euclidean distance to the center point (0.5, 0.5)
float getDistanceToCenter(in vec2 vUv) {
    // Define the center point of the UV space
    vec2 center = vec2(0.5, 0.5);

    // Calculate the distance from the UV coordinate to the center
    float distanceToCenter = length(vUv - center);

    // Return the computed distance
    return distanceToCenter;
}

// Calculates the distance from the given UV coordinate to the closest border of the surface
// vUv: UV coordinate (vec2), typically in the range [0.0, 1.0]
// offset: An adjustment value that controls how far from the border to calculate the distance
// Returns the minimum distance to the border, taking the offset into account
float distanceFromBoarder(in vec2 vUv, in float offset) {
    if (offset > 0.0) {
        // Calculate the horizontal and vertical distances to the closest borders with a positive offset
        float horizontal = min(vUv.x + offset, 1.0 - vUv.x - offset);
        float vertical = min(vUv.y + offset - 0.1, 1.0 - vUv.y - offset);

        // Return the smaller of the two distances
        return min(horizontal, vertical);
    } else {
        // Calculate the horizontal and vertical distances to the closest borders with a negative offset
        float horizontal = min(vUv.x + offset, 1.0 - vUv.x - 0.5 * offset);
        float vertical = min(vUv.y + offset - 0.1, 1.0 - vUv.y + offset);

        // Return the smaller of the two distances
        return min(horizontal, vertical);
    }
}

// Calculates the border intensity based on the distance from the borders of the surface
// vUv: UV coordinate (vec2)
// offset: An adjustment value to control the distance from the border
// Returns a vec3 representing the intensity of different border effects (color, edge, hatch)
vec3 getBorderIntensity(in vec2 vUv, in float offset) {
    // Base values for the border intensities
    vec3 r = vec3(0.1, 0.01, 0.01);  // Starting points for smoothstep functions
    vec3 gradientDistance = vec3(0.1, 0.01, 0.05);  // Gradient widths for smooth transitions

    // Calculate the color intensity based on the distance from the border with the given offset
    float color = smoothstep(r.x, r.x + gradientDistance.x, distanceFromBoarder(vUv, offset));

    // Calculate the edge intensity based on the distance from the border without any offset
    float edge = smoothstep(r.y, r.y + gradientDistance.y, distanceFromBoarder(vUv, 0.0));

    // Calculate the hatch intensity based on the distance from the border with a scaled offset
    float hatch = smoothstep(r.z, r.z + gradientDistance.z, distanceFromBoarder(vUv, 0.3 * offset));

    // Return the combined intensities as a vec3 (color, edge, hatch)
    return vec3(color, edge, hatch);
}

float quantize(float l, int levels) {
    // Step size between each quantized level
    float stepSize = 1.0 / float(levels);

    // Find the interval index
    int index = int(floor(l / stepSize));

    // Calculate the midpoint of the interval
    float midpoint = (float(index) + 0.5) * stepSize;

    return midpoint;
}

// Helper function to calculate the rotation matrix based on luma
mat2 getRotationMatrix(float luma, float angle) {
    float a = angle + mix(0.0, TAU, luma);
    float s_a = sin(a);
    float c_a = cos(a);
    return mat2(c_a, -s_a, s_a, c_a);
}

float distanceFromTopLeftCorner(in vec2 vUv) {
    // return length(vUv);
    return (1.-vUv.x + vUv.y)/2.;
}
vec2 rotate45AroundPoint(vec2 v) {
    vec2 center = vec2(0.5, 0.5);
    // Define the angle in radians (45 degrees = π/4)
    float angle = 3.1415926 / 8.0;

    // Calculate the sine and cosine of the angle
    float cosTheta = cos(angle);
    float sinTheta = sin(angle);

    // Translate the point to make the center the origin
    vec2 translated = v - center;

    // Apply the 2D rotation matrix
    vec2 rotated = vec2(
        translated.x * cosTheta - translated.y * sinTheta,
        translated.x * sinTheta + translated.y * cosTheta
    );

    // Translate the point back to its original position
    return rotated + center;
}

float bucketSinWave(in float t, in vec2 vUv) {
    float bucketSize = 0.1;

    vUv = rotate45AroundPoint(vUv);
    
    // Determine bucket boundaries
    float bucketStart = floor(vUv.x / bucketSize) * bucketSize;
    float bucketEnd = bucketStart + bucketSize;
    float bucketMiddle = bucketStart + bucketSize / 2.0;

    // Sinusoidal wave value in the current bucket
    float waveValue = sin(3.1415926 * (t - bucketStart) / bucketSize);

    // Handle cases where t is outside the bucket range
    if (t <= bucketStart) return 0.0;
    if (t >= bucketEnd) return 1.0;

    // Determine if we're in the left or right half of the bucket
    bool inLeftHalf = vUv.x <= bucketMiddle;

    // Evaluate conditions based on t and vUv.y
    if (inLeftHalf) {
        if (t <= bucketMiddle) {
            return waveValue > vUv.y ? 1.0 : 0.0;
        } else {
            return 1.0;
        }
    } else {
        if (t > bucketMiddle) {
            return waveValue > vUv.y ? 0.0 : 1.0;
        } else {
            return 0.0;
        }
    }
}

float distanceFromCanvasBorder(in vec2 vUv) {
    float distance = min(vUv.x, 1.02 - vUv.x);
    distance = min(distance, vUv.y - 0.07);
    distance = min(distance,  1.1 - vUv.y);
    return distance;
}

