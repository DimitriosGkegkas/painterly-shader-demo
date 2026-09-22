// Computes the luma (brightness) of a given color vector (RGB)
float luma(vec3 color) {
    return color.b;
    return pow(dot(color, vec3(0.2126, 0.7152, 0.0722)), 1.0 / 1.8);  // Standard luminance with gamma correction
}

// Overloaded luma function for a vec4 color input
float luma(vec4 color) {
    return luma(color.rgb);  // Ignore the alpha channel
}

  // Darken blend mode for two float values
  // base: The base color value
  // blend: The blend color value
  // Returns the darker of the two values
float blendDarken(float base, float blend) {
    return min(blend, base);  // Darken by taking the minimum of the two values
}

  // Darken blend mode for two vec3 (RGB) colors
  // base: The base color (vec3)
  // blend: The blend color (vec3)
  // Returns a color where each channel is the darker of the corresponding channels from base and blend
vec3 blendDarken(vec3 base, vec3 blend) {
    return vec3(blendDarken(base.r, blend.r),  // Darken the red channel
    blendDarken(base.g, blend.g),  // Darken the green channel
    blendDarken(base.b, blend.b)   // Darken the blue channel
    );
}

  // Darken blend mode for two vec3 (RGB) colors with opacity control
  // base: The base color (vec3)
  // blend: The blend color (vec3)
  // opacity: The blend strength (0.0 to 1.0)
  // Returns a blended color with the darken effect and controlled opacity
vec3 blendDarken(vec3 base, vec3 blend, float opacity) {
      // Calculate the darkened color
    vec3 darkened = blendDarken(base, blend);

      // Mix the darkened color with the base color based on the given opacity
      // (1.0 - opacity) determines how much of the base color remains
    return darkened * opacity + base * (1.0 - opacity);
}

vec3 blend(vec3 base, vec3 blend, float opacity) {
      // Mix the darkened color with the base color based on the given opacity
      // (1.0 - opacity) determines how much of the base color remains
    return blend * opacity + base * (1.0 - opacity);
}


// Function to sample a texture and return its luma value (brightness)
// src: Input texture (sampler2D)
// uv: Texture coordinates (vec2)
float sampleSrc(in sampler2D src, in vec2 uv) {
    // Sample the texture at the given UV coordinates
    vec4 color = texture(src, uv);

    // Convert the sampled color to luma (grayscale brightness)
    float l = luma(color.rgb);

    // Return the luma value
    return l;
}

// Function to sample the texture and quantize the luma value into discrete levels
// src: Input texture (sampler2D)
// uv: Texture coordinates (vec2)
// level: Threshold level to compare against
float sampleStep(in sampler2D src, in vec2 uv, in float level) {
    // Get the luma value from the sampled texture
    float l = sampleSrc(src, uv);

    // Quantize the luma value into discrete levels using a global variable fLEVELS
    l = round(l * fLEVELS) / fLEVELS;

    // Return 1.0 if the quantized luma value is above the threshold level, otherwise return 0.0
    return l > level ? 1.0 : 0.0;
}

vec3 rgb2hsl(in vec3 c) {
    float h = 0.0;
    float s = 0.0;
    float l = 0.0;
    float r = c.r;
    float g = c.g;
    float b = c.b;
    float cMin = min(r, min(g, b));
    float cMax = max(r, max(g, b));

    l = (cMax + cMin) / 2.0;
    if(cMax > cMin) {
        float cDelta = cMax - cMin;

          //s = l < .05 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) ); Original
        s = l < .0 ? cDelta / (cMax + cMin) : cDelta / (2.0 - (cMax + cMin));

        if(r == cMax) {
            h = (g - b) / cDelta;
        } else if(g == cMax) {
            h = 2.0 + (b - r) / cDelta;
        } else {
            h = 4.0 + (r - g) / cDelta;
        }

        if(h < 0.0) {
            h += 6.0;
        }
        h = h / 6.0;
    }
    return vec3(h, s, l);
}

vec3 hsl2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

float rgbToSaturation(vec3 color) {
    // return color.r;
    vec3 hsl = rgb2hsl(color);
    return (color.r + color.g + color.b);
}

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
    vec3 paperContribution = pow(paperColor + colorFloor, vec3(1.0 - inkDensity));
    vec3 inkContribution = pow(denseInkColor + colorFloor, vec3(inkDensity));
    return max(paperContribution * inkContribution - colorFloor, vec3(0.0));
}

// Helper function to calculate quantized luma based on discrete levels
float quantizeLuma(float luma, float levels) {
    return round(luma * levels) / levels;
}
// Helper function to blend the final ink color
vec3 blendFinalInk(vec3 baseColor, vec3 inkColor, float blendFactor) {
    return blendDarken(baseColor, inkColor / 255.0, blendFactor);
}
