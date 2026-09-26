float sampleEdgeSignal(sampler2D src, vec2 uv) {
    vec3 color = texture(src, uv).rgb;

    // Red stores the material's depth/orientation signal.
    return color.r;
}

float sobelFloatSmooth(
    sampler2D src,
    vec2 uv,
    vec2 viewportSizeCSS,
    float radiusCSS
) {
    // A fixed distance on the page spans more render texels on a high-DPR display.
    float sampleRadiusCSS = max(radiusCSS, 0.0001);
    vec2 texel = vec2(sampleRadiusCSS) / max(viewportSizeCSS, vec2(1.0));

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

    // Normalize both the Scharr weights and sample spacing. For a linear ramp,
    // this measures signal change per CSS pixel regardless of radius or DPR.
    float gradient = length(vec2(horiz, vert)) / (64.0 * sampleRadiusCSS);
    return gradient;
}
