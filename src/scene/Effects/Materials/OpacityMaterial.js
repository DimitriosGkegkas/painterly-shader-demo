import { Color, MeshNormalMaterial } from 'three'

class Material extends MeshNormalMaterial {
  constructor(options) {
    super(options)

    this.params = {
      angleGrid: 0,
      scale: 40,
      color: new Color(0x0000ff),
    }

    this.uniforms = {
      angleGrid: { value: this.params.angleGrid },
      scale: { value: this.params.scale },
      color: { value: this.params.color },
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
        // in vec3 color; // Incoming vertex color
        out vec3 vColor; // Passing to fragment shader
        `
      )
      shader.vertexShader = shader.vertexShader.replace(
        `#include <uv_vertex>`,
        `#include <uv_vertex>
        vColor = color; // Pass vertex color to fragment shader
        vCoords = uv;
        vPosition = position;
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <clipping_planes_pars_fragment>`,
        `#include <clipping_planes_pars_fragment>
        in vec3 vColor; // Receiving vertex color
        // #extension GL_OES_standard_derivatives : enable

        in vec2 vCoords;
        in vec3 vPosition;
        in vec4 vWorldPosition;
        uniform vec3 color;
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `
        #include <normal_fragment_maps>
        vec3 normalizedNormal = normalize(normal);
        // Compute dot product with the reference direction
        vec3 referenceDir = vec3(0.2, 0.5, 0.2);
  
        float alignment = dot(normalizedNormal, normalize(referenceDir));
        alignment = alignment + 1.0;
        alignment = alignment / 2.0;
        
        
        
        // gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
      
        gl_FragColor.r = vColor.r;
        gl_FragColor.g = vColor.g * alignment;
        gl_FragColor.b = vColor.b * alignment;

        // gl_FragColor.r = normalizedNormal.r;
        // gl_FragColor.g = normalizedNormal.g;
        // gl_FragColor.b = normalizedNormal.b;

        gl_FragColor.a = 1.0;
      
        return;
        `
      )
    }
  }
}

export default Material
