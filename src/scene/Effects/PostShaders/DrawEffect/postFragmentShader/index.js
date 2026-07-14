import color from "./color.glsl"; // This works now!
import main from "./main.glsl";
import sobel from "./sobel.glsl";
import noise from "./noise.glsl";
import constants from "./constants.glsl";
import math from "./math.glsl";
import hatch from "./hatch.glsl";

const fragmentShader = constants + "\n" + color + "\n" + math + "\n" + noise + "\n" + sobel  + "\n" + hatch + "\n" + main;

export default fragmentShader;