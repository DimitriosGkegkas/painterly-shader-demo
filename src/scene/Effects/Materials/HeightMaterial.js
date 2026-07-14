import { Color, MeshStandardMaterial, RepeatWrapping, TextureLoader } from 'three'
import color from '../PostShaders/DrawEffect/postFragmentShader/color.glsl'
import hatch from './hatch.glsl'

class HeightMaterial extends MeshStandardMaterial {
    constructor(options = {}) {
        super(options)

        const noiseTexture = new TextureLoader().load('/assets/noise.png')
        noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping

        const cityTexture = new TextureLoader().load('/assets/2024-12-11-12-43-46-01-8-2.jpg')
        cityTexture.flipY = false

        this.uniforms = {
            scale: { value: 3 },
            inkColor: { value: options.inkColor ?? new Color(0.0, 0.1, 0.7) },
            bgColor: { value: options.bgColor ?? new Color(0.0, 0.1, 1) },
            noiseTexture: { value: noiseTexture },
            cityTexture: { value: cityTexture },
            thickness: { value: options.thickness ?? 0 },
            noisiness: { value: 1 },
            angle: { value: options.angle ?? 90 },
            distance: { value: options.distance ?? 1 },
            contours: { value: options.thickness ?? 1 },
        }

        this.onBeforeCompile = (shader) => {
            for (const uniformName of Object.keys(this.uniforms)) {
                shader.uniforms[uniformName] = this.uniforms[uniformName]
            }

            shader.vertexShader = shader.vertexShader.replace(
                `#include <common>`,
                `#include <common>
                out vec2 vCoords;
                out vec3 vPosition;
                out vec4 vWorldPosition;`
            )
            shader.vertexShader = shader.vertexShader.replace(
                `#include <uv_vertex>`,
                `#include <uv_vertex>
                vCoords = uv;
                vPosition = position;
                vWorldPosition = modelViewMatrix * vec4(position, 1.);`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <common>`,
                `#include <common>

#define TAU 7.28318530718
#define LEVELS 6
#define fLEVELS float(LEVELS)

uniform float scale;
uniform float thickness;
uniform float noisiness;
uniform float angle;
uniform vec3 inkColor;
uniform vec3 bgColor;
uniform float distance;
uniform int contours;
uniform sampler2D cityTexture;

        in vec2 vCoords;
        in vec3 vPosition;
        in vec4 vWorldPosition;
            mat2 rotate2d(float _angle){
            return mat2(cos(_angle),-sin(_angle),sin(_angle),cos(_angle));
        }


` +
                    '\n' +
                    color +
                    '\n' +
                    hatch
            )

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>



        // Noise Texture 
        float noise = noisiness * fbm3(noisiness * vPosition.xyz);

        float hatchAcc = texh_altitude(vPosition.y, 0.0, distance / (1. + 1.*smoothstep(-3.0, -2., vPosition.y)), thickness, contours);

        if (vPosition.y < -5.0) {
                hatchAcc = 1.0;
            }

        vec4 cityTextureColor = texture(cityTexture, vec2(vCoords.x, vCoords.y));
        gl_FragColor.rgb = blend(bgColor, inkColor, 1. - hatchAcc);
        // gl_FragColor.r = smoothstep(40.0, 50.0, length(vPosition.xz)) + cityTextureColor.r;
        
        gl_FragColor.b -= 0.7*smoothstep(-8.0, -2., vPosition.y + noise);
        gl_FragColor.b -=  0.2* gl_FragColor.b *smoothstep(0.0, 0.4, cityTextureColor.b);
        gl_FragColor.b = 1. - gl_FragColor.b;
        
        float r = 30.0;
        vec2 offset = vec2(0.0, 10.0);
        gl_FragColor.b *= 1.0 - smoothstep(r, r + 50., length(vPosition.xz+ offset));

        gl_FragColor.g += 0.6*smoothstep(-5.0, -0., vPosition.y + 0.7*noise);

        
        `
            )
        }
    }
}

export { HeightMaterial }
