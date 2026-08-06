vec3 blur3x3(sampler2D src, vec2 uv, vec2 texelSize) {
    vec3 result = vec3(0.0);
    for (int dx = -1; dx <= 1; ++dx) {
        for (int dy = -1; dy <= 1; ++dy) {
            result += texture(src, uv + vec2(float(dx), float(dy)) * texelSize).rgb;
        }
    }
    return result / 9.0;
}

float sobelFloatSmooth(
    sampler2D src,
    vec2 uv,
    vec2 resolution,
    float width,
    float threshold,
    float softness
) {
    float x = width / resolution.x;
    float y = width / resolution.y;
    vec2 offset = vec2(x, y);

    float horiz = 0.0;
    float vert = 0.0;

    for (int i = -1; i <= 1; ++i) {
        for (int j = -1; j <= 1; ++j) {
            vec2 sampleUv = uv + vec2(float(i) * x, float(j) * y);
            vec3 blurred = blur3x3(src, sampleUv, offset);
            // float lum = dot(blurred, vec3(0.299, 0.587, 0.114));
            float lum = blurred.r; // Use the red channel for edge detection

            float hWeight = float(i) * (j == 0 ? 2.0 : 1.0);
            float vWeight = float(j) * (i == 0 ? 2.0 : 1.0);

            horiz += lum * hWeight;
            vert += lum * vWeight;
        }
    }

    float gradient = sqrt(horiz * horiz + vert * vert);

    return smoothstep(threshold - softness, threshold + softness, gradient);
}

vec3 diagonalBlur(sampler2D tex, vec2 uv, vec2 texelSize) {
    vec3 sum = vec3(0.0);
    sum += texture2D(tex, uv + texelSize).rgb;
    sum += texture2D(tex, uv - texelSize).rgb;
    sum += texture2D(tex, uv + vec2(texelSize.x, -texelSize.y)).rgb;
    sum += texture2D(tex, uv + vec2(-texelSize.x, texelSize.y)).rgb;
    return sum / 4.0;
}
