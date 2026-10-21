
//                              Canvas,    WebGPU, ComputeNoiseShader,   ComputeBuffer, ComputeBufferParams
export function displayPipeline(canvasObj, device, computeShaderSampler, computeBuffer, computeShaderParams) {

    //--GEOMETERY--

    //Flat View
    const vertices = new Float32Array(quad2DToTriangles([
        //X, Y
        -1, -1,
         1, -1,
         1,  1,
        -1,  1,
    ]));

    //Buffer of Vertex Info for GPU
    const vertexBuffer = device.createBuffer({
        // Label for debugging
        label: "2D Blocks Verticies",
        // Size of Buffer
        size: vertices.byteLength,
        //  Flags: Vertex Data & Copy data into array
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices);

    //Define Vertex Buffer Layout
    const vertexBufferLayout = {
        // Length of vertex info in memory
        arrayStride: 8,
        // Info per Vertex
        attributes: [{
            // Position (x, y) Format
            format: "float32x2",
            // Buffer Offset
            offset: 0,
            // Position in vertex shader
            shaderLocation: 0,
        }],
    };

    //--BLOCK BUFFER--

    const blocksSize = parseInt(canvasObj.canvas.getAttribute("size"));
    const canvasSize = parseInt(canvasObj.canvas.getAttribute("width"));

    const blockStateArray = new Uint32Array(blocksSize * blocksSize);
    const blockStateBuffer = device.createBuffer({
        label: "Block States",
        size: blockStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    //--RENDERING--

    const shaderModule = device.createShaderModule({
        label: "2D Blocks Noise Rendering Module",
        code: `
            //Dynamically created Array of Blocks
            @group(0) @binding(0) var<storage> blockState: array<u32>;

            struct VertexOutput {
                @builtin(position) pos: vec4f,
            }

            //Vertex Shader
            @vertex
            fn vertexMain(@location(0) pos: vec2f, @builtin(instance_index) instance: u32) -> VertexOutput {

                let i = f32(instance);
                let cell = vec2f(i % ${blocksSize}, floor(i / ${blocksSize}));
                let state = f32(blockState[instance]);
                let gridPos = (pos * 1 * state + 1 + cell * 2) / ${blocksSize} - 1;

                var output: VertexOutput;
                output.pos = vec4f(gridPos, 0, 1);
                return output;
            }

            //Fragment Shader
            @fragment
            fn fragmentMain() -> @location(0) vec4f {
                return vec4f(1, 1, 1, 1);
            }
        `,
    });

    //Create Render Pipeline for Shaders
    const renderPipeline = device.createRenderPipeline({
        label: "2D Blocks Render Pipeline",
        // Inputs other than vertex buffers
        layout: "auto",
        vertex: {
            // Shader
            module: shaderModule,
            // Function
            entryPoint: "vertexMain",
            // Inputs
            buffers: [vertexBufferLayout]
        },
        fragment: {
            // Shader
            module: shaderModule,
            // Function
            entryPoint: "fragmentMain",
            // Format of output
            targets: [{
                format: canvasObj.canvasFormat
            }]
        }
    });

    //Create BindGroup for Rendering Shader
    const renderBindGroup = device.createBindGroup({
        label: "2D Blocks Renderer Bind Group",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: blockStateBuffer },
        ]
    });

    //--COMPUTE--

    const computeModule = device.createShaderModule({
        label: "2D Blocks Noise Compute Shader",
        code: `
            @group(0) @binding(0) var<storage, read_write> blockStateOut: array<u32>;

            //Add Uniforms
        `
            + computeShaderParams +
        `
            @group(0) @binding(1) var<uniform> params: Params;

            @compute @workgroup_size(16, 16, 1)
            fn computeMain(@builtin(global_invocation_id) id: vec3u) {
                let test = params.min;

                //Prevent out-of-bounds writes if the blocks size isn't a multiple of 16
                if (id.x >= ${blocksSize} || id.y >= ${blocksSize}) { return; }

                let c = computeTexture2D((f32(id.x) / ${blocksSize} - .5) * ${canvasSize}, (f32(id.y) / ${blocksSize} - .5) * ${canvasSize});

                blockStateOut[cellIndex(id.xy)] = u32(c > 0);
            }

            //Linearalizes (x, y)
            fn cellIndex(cell: vec2u) -> u32 {
                return cell.y * u32(${blocksSize}) + cell.x;
            }

            //Add Compute Texture 2D/3D
        ` + computeShaderSampler
    });

    const computePipeline = device.createComputePipeline({
        label: "2D Blocks Compute Array Pipeline",
        layout: "auto",
        compute: {
            module: computeModule,
            entryPoint: "computeMain",
        }
    });

    const computeBindGroup = device.createBindGroup({
        label: "2D Blocks Compute Bind Group",
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: blockStateBuffer },
            { binding: 1, resource: { buffer: computeBuffer } },
        ]
    });

    //--FINAL RENDER FRAME--

    return function renderFrame(encoder) {

        //Uniform Time Updates
        let timeIndex = canvasObj.uniformLabels.indexOf("time");
        if (timeIndex != -1)
            canvasObj.uniforms[timeIndex] = getTime();
        device.queue.writeBuffer(computeBuffer, 0, canvasObj.uniforms);

        //Compute Pass
        const computePass = encoder.beginComputePass();

        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(0, computeBindGroup);

        computePass.dispatchWorkgroups(Math.ceil(blocksSize / 16), Math.ceil(blocksSize / 16));
        computePass.end();

        //Rendering pass
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                // Canvas's width/height/textureFormat info
                view: canvasObj.context.getCurrentTexture().createView(),
                // First Action
                loadOp: "clear",
                // Set the Clear Value to Black
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                // Last Action
                storeOp: "store",
            }]
        });

        pass.setPipeline(renderPipeline);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setBindGroup(0, renderBindGroup);
        pass.draw(vertices.length / 2, blocksSize * blocksSize);
        pass.end();
    }
}