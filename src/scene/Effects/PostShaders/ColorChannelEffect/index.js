import { Effect } from 'postprocessing'
import { Uniform, Vector3 } from 'three'

const fragmentShader = /* glsl */ `
    uniform vec3 channelMask;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        outputColor = vec4(inputColor.rgb * channelMask, inputColor.a);
    }
`

const CHANNEL_MASKS = {
    all: [1, 1, 1],
    red: [1, 0, 0],
    green: [0, 1, 0],
    blue: [0, 0, 1],
    redGreen: [1, 1, 0],
    redBlue: [1, 0, 1],
    greenBlue: [0, 1, 1],
}

class ColorChannelEffect extends Effect {
    constructor() {
        super('ColorChannelEffect', fragmentShader, {
            uniforms: new Map([
                ['channelMask', new Uniform(new Vector3(1, 1, 1))],
            ]),
        })
    }

    setChannel(channel = 'all') {
        const [r, g, b] = CHANNEL_MASKS[channel] ?? CHANNEL_MASKS.all
        this.uniforms.get('channelMask').value.set(r, g, b)
    }
}

export { ColorChannelEffect }
