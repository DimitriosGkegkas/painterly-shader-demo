uniform sampler2D paperTexture;
uniform vec2 edgeViewportSize;
uniform vec3 channelMask;
uniform float appearance;
uniform bool usePaperTexture;

void mainImage(const in vec4 inputColor, const in vec2 vUv, out vec4 fragColor) {
    // Apply final blending with paper texture and ink color
    vec4 paper = usePaperTexture ? texture(paperTexture, vUv) : vec4(1.0);

    float reveal = clamp(appearance, 0.0, 1.0);
    if (reveal == 0.0) {
        fragColor = vec4(paper.rgb, 1.0);
        return;
    }

    // Texture strength controls grain; inkMask controls how densely the color builds up.
    float textureStrength = 10.0;
    float paperMidpoint = 0.734; // Approximate average sRGB brightness of Craft_Light.jpg.
    // RGB swatch values are sRGB: decode them before blending in linear RGB.
    vec3 washColorSRGB = vec3(0.51, 0.22, 0.05);
    vec3 finalInk = srgbToLinearExact(washColorSRGB);
    vec3 outlineColor = vec3(0.0);

    float blue = mix(1.0, inputColor.b, channelMask.b);
    float inkMask = clamp(reveal - blue, 0.0, 1.0);
    // Five density levels, including bare paper (0) and full ink (1).
    // float inkBandCount = 5.0;
    // float inkBandSteps = max(inkBandCount - 1.0, 1.0);
    // inkMask = round(inkMask * inkBandSteps) / inkBandSteps;

    vec3 texturedInk = getTextureInk(paper.rgb, finalInk, usePaperTexture ? textureStrength : 0.0, paperMidpoint, inkMask);

    fragColor.rgb = texturedInk;
    fragColor.a = 1.0;

    // A disabled red channel is constant, so its gradient is zero everywhere.
    if (channelMask.r == 0.0) return;

    float edgeIntensity = 2.0 * mix(1.0, inputColor.g, channelMask.g);
    float edgeRadiusCSS = 0.5;
    float edgeAcc = edgeIntensity * sobelFloatSmooth(inputBuffer, vUv, edgeViewportSize, edgeRadiusCSS);
    // Fade outlines with the reveal, independently of the wash density.
    fragColor.rgb = mix(fragColor.rgb, outlineColor, clamp(edgeAcc, 0.0, 1.0) * reveal);

}
