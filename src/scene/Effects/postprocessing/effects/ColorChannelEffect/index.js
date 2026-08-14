import { Effect } from 'postprocessing'
import { Uniform, Vector3 } from 'three'

const fragmentShader = /* glsl */ `
    uniform vec3 channelMask;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        outputColor = inputColor;
        if (channelMask.x == 0.0) {
            outputColor.r = 1.0;
        }
        if (channelMask.y == 0.0) {
            outputColor.g = 1.0;
        }
        if (channelMask.z == 0.0) {
            outputColor.b = 1.0;
        }
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
