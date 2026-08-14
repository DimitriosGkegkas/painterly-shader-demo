float sampleEdgeSignal(sampler2D src, vec2 uv) {
    vec3 color = texture(src, uv).rgb;

    // Disabled channels are forced to 1.0 upstream, so "darkness from white"
    // gives a stable scalar edge signal regardless of the selected channel mask.
    return color.r;
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
    vec2 texel = vec2(x, y);

    float s00 = sampleEdgeSignal(src, uv + vec2(-texel.x, -texel.y));
    float s10 = sampleEdgeSignal(src, uv + vec2(0.0, -texel.y));
    float s20 = sampleEdgeSignal(src, uv + vec2(texel.x, -texel.y));
    float s01 = sampleEdgeSignal(src, uv + vec2(-texel.x, 0.0));
    float s21 = sampleEdgeSignal(src, uv + vec2(texel.x, 0.0));
    float s02 = sampleEdgeSignal(src, uv + vec2(-texel.x, texel.y));
    float s12 = sampleEdgeSignal(src, uv + vec2(0.0, texel.y));
    float s22 = sampleEdgeSignal(src, uv + vec2(texel.x, texel.y));

    // Scharr gives better rotational symmetry than Sobel and already includes
    // smoothing in the orthogonal direction, so the extra 3x3 pre-blur is unnecessary.
    float horiz =
        3.0 * s00 + 10.0 * s01 + 3.0 * s02 -
        3.0 * s20 - 10.0 * s21 - 3.0 * s22;
    float vert =
        3.0 * s00 + 10.0 * s10 + 3.0 * s20 -
        3.0 * s02 - 10.0 * s12 - 3.0 * s22;

    float gradient = length(vec2(horiz, vert)) / 32.0;

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
