import { Color, MeshStandardMaterial, RepeatWrapping, TextureLoader } from 'three'
import color from '../PostShaders/DrawEffect/postFragmentShader/color.glsl'
import hatch from './hatch.glsl'

class LineMaterialM extends MeshStandardMaterial {
    constructor(options = {}) {
        super(options)

        const noiseTexture = new TextureLoader().load('/assets/noise.png')
        noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping

        this.uniforms = {
            scale: { value: 5 },
            inkColor: { value: options.inkColor ?? new Color(0.0 , 0.83, 1) },
            bgColor: { value: options.bgColor ?? new Color(0.3 , 0.85, 1.05) },
            //bgColor: { value: options.bgColor ?? new Color(0.0, 0.8, 0.25) },
            noiseTexture: { value: noiseTexture },
            thickness: { value: options.thickness ?? 2. },
            noisiness: { value: options.noisiness ?? 1.2 },
            angle: { value: options.angle ?? 1. },
            distance : { value: options.distance ??  0.03 },
            contours : { value: options.thickness ?? 5. },
            time: { value: 0 }
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
uniform float time;

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

        float speed = 0.02;
        float maxOffset = 1.4; // Set the maximum value before looping
        float loopedTime = time * speed;

        // Noise Texture 
        float noise = (noisiness + noisiness/2. *sin(loopedTime) )* fbm3(noisiness * (vPosition.xyz + vec3(0., loopedTime, 0.)));
        // noise = 0.0;
        float r =  5.;
        vec2 offset = vec2(0.0, 2.0);


        vec2 animatedOffset =vPosition.xz + vec2(0.0, loopedTime);
        float hatchAcc = calculateHatchLevel(scale * (animatedOffset), noise, rotate2d(angle), distance * 4. , thickness, contours);
                

        vec3 bgColorOp = bgColor;
        float distanceFromCenter = smoothstep(r, r + 3., length(vPosition.xz + offset));
        bgColorOp.b -= distanceFromCenter;
        gl_FragColor.rgb = blend(bgColorOp, inkColor, 1. - hatchAcc);
        // gl_FragColor.b = 1. - gl_FragColor.b;
        gl_FragColor.b *= max(1. - distanceFromCenter, 0.0);
        
        `
            )
        }
    }
}

export { LineMaterialM }
