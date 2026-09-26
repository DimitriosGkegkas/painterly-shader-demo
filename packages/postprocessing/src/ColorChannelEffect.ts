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

const CHANNEL_MASKS = Object.freeze({
    all: [1, 1, 1],
    red: [1, 0, 0],
    green: [0, 1, 0],
    blue: [0, 0, 1],
    redGreen: [1, 1, 0],
    redBlue: [1, 0, 1],
    greenBlue: [0, 1, 1],
} as const)

export type ColorChannel = keyof typeof CHANNEL_MASKS

export function normalizeColorChannel(channel: string): ColorChannel {
    return Object.prototype.hasOwnProperty.call(CHANNEL_MASKS, channel) ? (channel as ColorChannel) : 'all'
}

class ColorChannelEffect extends Effect {
    constructor(channel: ColorChannel = 'all') {
        super('ColorChannelEffect', fragmentShader, {
            uniforms: new Map([['channelMask', new Uniform(new Vector3(1, 1, 1))]]),
        })
        this.setChannel(channel)
    }

    setChannel(channel: ColorChannel = 'all'): void {
        const [r, g, b] = CHANNEL_MASKS[normalizeColorChannel(channel)]
        this.uniforms.get('channelMask')!.value.set(r, g, b)
    }
}

export { ColorChannelEffect, CHANNEL_MASKS }
