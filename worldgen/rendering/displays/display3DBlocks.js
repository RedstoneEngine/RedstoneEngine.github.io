
//                              Canvas,    WebGPU, ComputeNoiseShader,   ComputeBuffer, ComputeBufferParams
export function displayPipeline(canvasObj, device, computeShaderSampler, computeBuffer, computeShaderParams) {

    //--GEOMETERY--

    //0.866 = sqrt(3)/2

    //Big Cube View
    let quadVerts = quad2DToTriangles([
        //X, Y
         0,     0,
         0.866, 0.5,
         0,     1,
        -0.866, 0.5,
    ]);
    quadVerts = quadVerts.concat(quad2DToTriangles([
        //X, Y
         0,     -1,
         0.866, -0.5,
         0.866,  0.5,
         0,      0,
    ]));
    quadVerts = quadVerts.concat(quad2DToTriangles([
        //X, Y
         0,     -1,
         0,      0,
        -0.866,  0.5,
        -0.866, -0.5,
    ]));

    const vertices = new Float32Array(quadVerts);


    //Buffer of Vertex Info for GPU
    const vertexBuffer = device.createBuffer({
        // Label for debugging
        label: "3D Cubes Vertices",
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

    //--BLOCKS BUFFER--

    const blocksSize = parseInt(canvasObj.canvas.getAttribute("size"));
    const canvasSize = parseInt(canvasObj.canvas.getAttribute("width"));

    const blockStateArray = new Uint32Array(blocksSize * blocksSize * blocksSize);
    const blockStateBuffer = device.createBuffer({
        label: "Block States",
        size: blockStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    //--DEPTH TEXTURE--

    const depthTexture = device.createTexture({
        size: [canvasSize, canvasSize],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    //--RENDERING--

    const shaderModule = device.createShaderModule({
        label: "3D Blocks Noise Rendering Module",
        code: `
            //Dynamically created Array of Blocks
            @group(0) @binding(0) var<storage> blockState: array<u32>;

            struct VertexOutput {
                @builtin(position) pos: vec4f,
                @location(1) @interpolate(flat) quadIndex: u32,
            }

            //Vertex Shader
            @vertex
            fn vertexMain(@location(0) pos: vec2f, @builtin(vertex_index) vIndex : u32, @builtin(instance_index) instance: u32) -> VertexOutput {
                let i = f32(instance);
                let cell = vec3f(i % ${blocksSize}, floor(i / ${blocksSize}) % ${blocksSize}, floor(i / (${blocksSize} * ${blocksSize})));
                let state = f32(blockState[instance]);
                let gridPos = (pos * 1 * state +
                    vec2f(0.866, 0.5) * cell.x +
                    vec2f(0, -1) * (${blocksSize} - 1 - cell.y) +
                    vec2f(-0.866, 0.5) * cell.z) / ${blocksSize};

                var output: VertexOutput;
                output.pos = vec4f(gridPos, f32((${blocksSize} - cell.y) + cell.x + cell.z) * .001, 1);
                output.quadIndex = vIndex / 6;
                return output;
            }

            //Fragment Shader
            @fragment
            fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
                let c = 1 - f32(input.quadIndex) * .2;
                return vec4f(c, c, c, 1);
            }
        `,
    });

    //Create Render Pipeline for Shaders
    const renderPipeline = device.createRenderPipeline({
        label: "3D Blocks Render Pipeline",
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
        },
        //Draw 3D objects with depth in mind
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    });

    //Create BindGroup for Rendering Shader
    const renderBindGroup = device.createBindGroup({
        label: "3D Blocks Renderer Bind Group",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: blockStateBuffer },
        ]
    });

    //--COMPUTE--

    const computeModule = device.createShaderModule({
        label: "3D Blocks Noise Compute Shader",
        code: `
            @group(0) @binding(0) var<storage, read_write> blockStateOut: array<u32>;

            //Add Uniforms
        `
            + computeShaderParams +
        `
            @group(0) @binding(1) var<uniform> params: Params;

            @compute @workgroup_size(8, 8, 4)
            fn computeMain(@builtin(global_invocation_id) id: vec3u) {
                let test = params.min;

                //Prevent out-of-bounds writes if the texture size isn't a multiple of 8
                if (id.x >= ${blocksSize} || id.y >= ${blocksSize} || id.z >= ${blocksSize}) { return; }

                let c = computeTexture3D((f32(id.x) / ${blocksSize} - .5) * ${canvasSize}, (f32(id.z) / ${blocksSize} - .5) * ${canvasSize}, (f32(id.y) / ${blocksSize} - .5) * ${canvasSize});

                blockStateOut[cellIndex(id.xyz)] = u32(c > 0);
            }

            //Linearalizes (x, y, z)
            fn cellIndex(cell: vec3u) -> u32 {
                return cell.x + cell.z * u32(${blocksSize}) + cell.y * u32(${blocksSize} * ${blocksSize});
            }

            //Add Compute Texture 2D/3D
        ` + computeShaderSampler
    });

    const computePipeline = device.createComputePipeline({
        label: "3D Blocks Compute Texture Pipeline",
        layout: "auto",
        compute: {
            module: computeModule,
            entryPoint: "computeMain",
        }
    });

    const computeBindGroup = device.createBindGroup({
        label: "3D Blocks Compute Bind Group",
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

        computePass.dispatchWorkgroups(Math.ceil(blocksSize / 8), Math.ceil(blocksSize / 8), Math.ceil(blocksSize / 4));
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
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });

        pass.setPipeline(renderPipeline);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setBindGroup(0, renderBindGroup);
        pass.draw(vertices.length / 2, blocksSize * blocksSize * blocksSize);
        pass.end();
    }
}