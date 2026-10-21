
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
        label: "3D Cube Vertices",
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

    //--TEXTURES--

    const textureSize = { width: parseInt(canvasObj.canvas.getAttribute("width")) * 3, height: parseInt(canvasObj.canvas.getAttribute("height")) };
    const dynamicTexture = device.createTexture({
        size: [textureSize.width, textureSize.height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING | 
                GPUTextureUsage.TEXTURE_BINDING | 
                GPUTextureUsage.RENDER_ATTACHMENT
    });
    const textureView = dynamicTexture.createView();

    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    //--RENDERING--

    const shaderModule = device.createShaderModule({
        label: "3D Noise Rendering Module",
        code: `
            //Dynamically created Texture
            @group(0) @binding(0) var myTexture: texture_2d<f32>;
            @group(0) @binding(1) var mySampler: sampler;

            struct VertexOutput {
                @builtin(position) pos: vec4f,
                @location(0) uv: vec2f,
                @location(1) @interpolate(flat) quadIndex: u32,
            }

            //Vertex Shader
            @vertex
            fn vertexMain(@location(0) pos: vec2f, @builtin(vertex_index) vIndex : u32) -> VertexOutput {
                const uv = array(
                    vec2f(0.0, 1.0),
                    vec2f(1.0, 1.0),
                    vec2f(1.0, 0.0),
                    vec2f(0.0, 1.0),
                    vec2f(1.0, 0.0),
                    vec2f(0.0, 0.0),
                );

                var output: VertexOutput;
                output.pos = vec4f(pos, 0, 1);
                output.uv = uv[vIndex % 6];
                output.quadIndex = vIndex / 6;
                return output;
            }

            //Fragment Shader
            @fragment
            fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
                let size = textureDimensions(myTexture);

                let uv = vec2f((input.uv.x + f32(input.quadIndex)) / 3, input.uv.y);

                return textureSample(myTexture, mySampler, uv);
            }
        `,
    });

    //Create Render Pipeline for Shaders
    const renderPipeline = device.createRenderPipeline({
        label: "3D Render Pipeline",
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
        label: "3D Renderer Bind Group",
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: textureView },
            { binding: 1, resource: sampler },
        ]
    });

    //--COMPUTE--

    const computeModule = device.createShaderModule({
        label: "3D Noise Compute Shader",
        code: `
            @group(0) @binding(0) var outputTex: texture_storage_2d<rgba8unorm, write>;

            //Add Uniforms
        `
            + computeShaderParams +
        `
            @group(0) @binding(1) var<uniform> params: Params;

            @compute @workgroup_size(16, 16, 1)
            fn computeMain(@builtin(global_invocation_id) id: vec3u) {
                let size = textureDimensions(outputTex);
                
                //Prevent out-of-bounds writes if the texture size isn't a multiple of 16
                if (id.x >= size.x || id.y >= size.y) { return; }

                //Calls to added function
                let side = id.x * 3 / size.x;

                var c: f32 = 0;

                switch (side) {
                    case 0: {
                        c = (computeTexture3D(f32(id.x) - f32(size.y / 2), f32(size.y / 2), -f32(id.y) + f32(size.y / 2)) - params.min) / (params.max - params.min);
                    }
                    case 1: {
                        c = (computeTexture3D(f32(id.x) - f32(size.y * 3 / 2), -f32(id.y) + f32(size.y / 2), -f32(size.y / 2)) - params.min) / (params.max - params.min);
                    }
                    default: {
                        c = (computeTexture3D(-f32(size.y / 2), f32(id.x) - f32(size.y * 5 / 2), -f32(id.y) + f32(size.y / 2)) - params.min) / (params.max - params.min);
                    }
                }

                textureStore(outputTex, id.xy, vec4f(c, c, c, 1.0));
            }

            //Add Compute Texture 2D/3D
        ` + computeShaderSampler
    });

    const computePipeline = device.createComputePipeline({
        label: "3D Compute Texture Pipeline",
        layout: "auto",
        compute: {
            module: computeModule,
            entryPoint: "computeMain",
        }
    });

    const computeBindGroup = device.createBindGroup({
        label: "3D Compute Bind Group",
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: textureView },
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

        computePass.dispatchWorkgroups(Math.ceil(textureSize.width / 16), Math.ceil(textureSize.height / 16));
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
        pass.draw(vertices.length / 2);
        pass.end();
    }
}