// Convert linear RGB to sRGB RGB.
vec3 linearToSRGB(vec3 color) {
    color = max(color, vec3(0.0));
    return mix(
        color * 12.92,
        1.055 * pow(color, vec3(1.0 / 2.4)) - vec3(0.055),
        step(vec3(0.0031308), color)
    );
}

// Convert sRGB RGB to linear RGB.
vec3 srgbToLinearExact(vec3 color) {
    color = max(color, vec3(0.0));
    return mix(
        color / 12.92,
        pow((color + vec3(0.055)) / 1.055, vec3(2.4)),
        step(vec3(0.04045), color)
    );
}

// Build up textured ink from bare paper (inkMask = 0) to dense ink (inkMask = 1).
// Inputs and output are linear RGB; the grain adjustment is performed in sRGB.
// paperMidpoint is the sRGB paper brightness that leaves the ink unchanged.
// textureStrength amplifies the grain; zero disables the grain adjustment.
vec3 getTextureInk(vec3 paperColor, vec3 inkColor, float textureStrength, float paperMidpoint, float inkMask) {
    float inkDensity = clamp(inkMask, 0.0, 1.0);
    if (inkDensity == 0.0) return paperColor;

    vec3 paperSRGB = linearToSRGB(clamp(paperColor, 0.0, 1.0));
    vec3 inkSRGB = linearToSRGB(clamp(inkColor, 0.0, 1.0));

    // Use one brightness signal so the paper's tint does not recolor the ink.
    float paperBrightness = dot(paperSRGB, vec3(0.2126, 0.7152, 0.0722));
    float textureVariation = clamp(
        (paperBrightness - paperMidpoint) * max(textureStrength, 0.0),
        -1.0, 1.0
    );

    vec3 inkForDarkPaper = mix(inkSRGB, vec3(0.0), max(-textureVariation, 0.0));
    vec3 inkForBrightPaper = mix(inkSRGB, vec3(1.0), max(textureVariation, 0.0));

    // Both branches equal the original ink at the midpoint, avoiding a color jump.
    float brightPaperMask = step(0.0, textureVariation);
    vec3 selectedInkSRGB = mix(inkForDarkPaper, inkForBrightPaper, brightPaperMask);

    vec3 denseInkColor = srgbToLinearExact(clamp(selectedInkSRGB, 0.0, 1.0));
    // Even the brightest grain cannot make the painted paper brighter than bare paper.
    denseInkColor = min(denseInkColor, paperColor);
    if (inkDensity == 1.0) return denseInkColor;

    // Multiplicative color buildup: at half density each channel is approximately
    // sqrt(paper * denseInk), giving richer midtones than an opacity blend.
    // The small offset keeps black channels well-defined and the transition continuous.
    vec3 colorFloor = vec3(0.00001);
    vec3 paperBase = paperColor + colorFloor;
    vec3 inkRatio = (denseInkColor + colorFloor) / paperBase;
    return max(paperBase * pow(inkRatio, vec3(inkDensity)) - colorFloor, vec3(0.0));
}

