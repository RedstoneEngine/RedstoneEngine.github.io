
import * as Display2D from './displays/display2D.js';
import * as Display2DBlocks from './displays/display2DBlocks.js';
import * as Display3D from './displays/display3D.js';
import * as Display3DBlocks from './displays/display3DBlocks.js';
import * as Simplex from './samplers/simplex.js'
import * as Math from './utils/math.js'

const UPDATE_INTERVAL = 1 / 45 * 1000; //ms

class CanvasObj {
    gpuContext;
    canvasFormat;
    pipelineRender;

    constructor(canvas) {
        this.canvas = canvas;
        this.uniforms = [canvas.getAttribute("min"), canvas.getAttribute("max")];
        this.uniformLabels = ["min", "max"];
    }
}

const canvases = [];

//Setup runs once
async function setupRenderers()
{
    //--DEFAULT SETUP--

    //Check for WebGPU
    if (!navigator.gpu) {
        throw new Error("WebGPU not supported on this browser.");
    }

    //Get the WebGPU adapter to interface (Can request hardware preferences)
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error("No appropriate GPUAdapter found.");
    }

    //Get the WebGPU device to utilize (Can request extra features)
    const device = await adapter.requestDevice();

    //--NEEDS TO BE MADE DYNAMICALLY--

    document.querySelectorAll("canvas").forEach((canvas) => {
        canvases.push(new CanvasObj(canvas));
        canvases.at(-1).pipelineRender = setupCanvasPipeline(device, canvases.at(-1));
    });

    //--RENDER--

    function renderFrame() {
        //Start GPU Device
        const encoder = device.createCommandEncoder();

        //Compute/Render
        canvases.forEach((canvasObj) => {
            canvasObj.pipelineRender(encoder, canvasObj);
        });

        //Finish Compute/Render
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);

    }
    setInterval(renderFrame, UPDATE_INTERVAL);
}

setupRenderers();

function setupCanvasPipeline(device, canvasObj)
{
    const canvas = canvasObj.canvas;

    //Link the Canvas to the WebGPU Device
    canvasObj.context = canvas.getContext("webgpu");
    // Canvas/Image file format (Can be modified)
    canvasObj.canvasFormat = navigator.gpu.getPreferredCanvasFormat(); // "rgba8unorm" or "bgra8unorm"
    canvasObj.context.configure({
        device: device,
        format: canvasObj.canvasFormat,
    });

    var function2D = canvas.hasAttribute("function2D") ? canvas.getAttribute("function2D") : "computeTexture3D(x, 0, z);";
    if (!function2D.includes("return"))
        function2D = "return " + function2D;
    var function3D = canvas.hasAttribute("function3D") ? canvas.getAttribute("function3D") : "computeTexture2D(x, z);";
    if (!function3D.includes("return"))
        function3D = "return " + function3D;

    //Add either 2D or 3D Noise Compute
    let computeShaderSampler =
    `
        fn computeTexture2D(x: f32, z: f32) -> f32 {
    `
        + function2D +
    `
        }

        fn computeTexture3D(x: f32, y: f32, z: f32) -> f32 {
    `
        + function3D +
    `
        }
    `

    //Add Sampler Libraries
    if (computeShaderSampler.includes('simplex2D('))
        computeShaderSampler += Simplex.simplex2D;
    if (computeShaderSampler.includes('simplex3D('))
        computeShaderSampler += Simplex.simplex3D;
    if (computeShaderSampler.includes('remap('))
        computeShaderSampler += Math.remap;
    if (computeShaderSampler.includes('rotate('))
        computeShaderSampler += Math.rotate;
    if (computeShaderSampler.includes('twist('))
        computeShaderSampler += Math.twist;

    //Define Uniforms
    let uniformParams =
    `struct Params {
        min: f32,
        max: f32,

    `

    let extraUniforms = canvas.hasAttribute("uniforms") ? canvas.getAttribute("uniforms").split(", ") : [];
    extraUniforms.forEach((uniform) => {
        uniformParams += uniform + ": f32,\n"

        canvasObj.uniformLabels.push(uniform);
        if (canvas.hasAttribute(uniform))
            canvasObj.uniforms.push(parseFloat(canvas.getAttribute(uniform)));
        else
            canvasObj.uniforms.push(0);
    });
    uniformParams += "}"

    //Create a Uniform Buffer
    canvasObj.uniforms = new Float32Array(canvasObj.uniforms);
    const uniformBuffer = device.createBuffer({
        label: "Compute Uniforms",
        size: canvasObj.uniforms.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, canvasObj.uniforms);


    //Call to initialize all needed render pipelines
    switch (canvas.getAttribute("display")) {
        case "2D":
            return Display2D.displayPipeline(canvasObj, device, computeShaderSampler, uniformBuffer, uniformParams);
        case "3D":
            return Display3D.displayPipeline(canvasObj, device, computeShaderSampler, uniformBuffer, uniformParams);
        case "2DBlocks":
            return Display2DBlocks.displayPipeline(canvasObj, device, computeShaderSampler, uniformBuffer, uniformParams);
        case "3DBlocks":
            return Display3DBlocks.displayPipeline(canvasObj, device, computeShaderSampler, uniformBuffer, uniformParams);
    }
}

globalThis.getTime = function() { return performance.now() * 0.01; }

globalThis.quad2DToTriangles = function(verticies)
{
    return [verticies[0], verticies[1],    verticies[2], verticies[3],     verticies[4], verticies[5],
            verticies[0], verticies[1],    verticies[4], verticies[5],     verticies[6], verticies[7]];
}

globalThis.quad3DToTriangles = function(verticies)
{
    return [verticies[0], verticies[1], verticies[2],  verticies[3], verticies[4], verticies[5],   verticies[6], verticies[7], verticies[8],
            verticies[0], verticies[1], verticies[2],  verticies[6], verticies[7], verticies[8],   verticies[9], verticies[10], verticies[11]]
}

globalThis.updateSlider = function updateSlider(self) {
    self.parentElement.children[0].innerText = self.value;

    canvases.forEach((canvas) => {
        if (canvas.canvas.id == self.getAttribute("canvas"))
            for (var i = 0; i < canvas.uniformLabels.length; i++)
                if (canvas.uniformLabels[i] == self.getAttribute("uniform"))
                    canvas.uniforms[i] = self.value;
    });
}