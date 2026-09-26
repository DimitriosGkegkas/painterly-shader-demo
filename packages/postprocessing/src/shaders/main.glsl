uniform sampler2D paperTexture;
uniform vec2 edgeViewportSize;
uniform vec3 channelMask;
uniform float appearance;
uniform bool usePaperTexture;
uniform vec3 inkColor;
uniform vec3 outlineColor;
uniform float textureStrength;
uniform float paperMidpoint;
uniform float edgeRadius;
uniform float edgeStrength;

void mainImage(const in vec4 inputColor, const in vec2 vUv, out vec4 fragColor) {
    // Apply final blending with paper texture and ink color
    vec4 paper = usePaperTexture ? texture(paperTexture, vUv) : vec4(1.0);

    float reveal = clamp(appearance, 0.0, 1.0);
    if (reveal == 0.0) {
        fragColor = vec4(paper.rgb, 1.0);
        return;
    }

    float blue = mix(1.0, inputColor.b, channelMask.b);
    float inkMask = clamp(reveal - blue, 0.0, 1.0);
    vec3 texturedInk = getTextureInk(paper.rgb, inkColor, usePaperTexture ? textureStrength : 0.0, paperMidpoint, inkMask);

    fragColor.rgb = texturedInk;
    fragColor.a = 1.0;

    // A disabled red channel is constant, so its gradient is zero everywhere.
    if (channelMask.r == 0.0) return;

    float edgeIntensity = edgeStrength * mix(1.0, inputColor.g, channelMask.g);
    float edgeAcc = edgeIntensity * sobelFloatSmooth(inputBuffer, vUv, edgeViewportSize, edgeRadius);
    // Fade outlines with the reveal, independently of the wash density.
    fragColor.rgb = mix(fragColor.rgb, outlineColor, clamp(edgeAcc, 0.0, 1.0) * reveal);

}
