const canvas = document.querySelector("canvas");

const GRID_SIZE = 32;
const WORKGROUP_SIZE = 8;

const UPDATE_INTERVAL = 200; // Update every 200ms (5 times/sec)
let step = 0; // Track how many simulation steps have been run

async function initCanvas() {

    //--SETUP--

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

    //Link the Canvas to the WebGPU Device
    const context = canvas.getContext("webgpu");
    // Canvas/Image file format (Can be modified)
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat(); // "rgba8unorm" or "bgra8unorm"
    context.configure({
        device: device,
        format: canvasFormat,
    });

    //--OBJECTS TO DRAW--

    //Setup Shapes to Render
    const vertices = squareToTriangles(new Float32Array([
        //X, Y
        -0.8, -0.8,
         0.8, -0.8,
         0.8,  0.8,
        -0.8,  0.8,
    ]));

    //Buffer of Vertex Info for GPU
    const vertexBuffer = device.createBuffer({
        // Label for debugging
        label: "Cell vertices",
        // Size of Buffer
        size: vertices.byteLength,
        //  Flags: Vertex Data & Copy data into array
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    //Setup a Write Buffer
    device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

    //Uniform Buffer of Grid Size
    const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
    const uniformBuffer = device.createBuffer({
        label: "Grid Uniforms",
        size: uniformArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);

    //CellState Storage Buffer
    const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);

    //Create the Ping-Pong Storage Buffers
    const cellStateStorage = [
        device.createBuffer({
            label: "Cell State A",
            size: cellStateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        }),
        device.createBuffer({
            label: "Cell State B",
            size: cellStateArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        }),
    ];

    //Write to both Storage Buffers an initial state
    // Mark every third cell of the grid as active.
    /*for (let i = 0; i < cellStateArray.length; i += 3) {
        cellStateArray[i] = 1;
    }
    device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);

    // Mark every other cell of the second grid as active.
    for (let i = 0; i < cellStateArray.length; i++) {
        cellStateArray[i] = i % 2;
    }
    device.queue.writeBuffer(cellStateStorage[1], 0, cellStateArray);*/

    // Set each cell to a random value
    for (let i = 0; i < cellStateArray.length; ++i) {
        cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;
    }
    device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);

    //Define Vertex Buffer
    const vertexBufferLayout = {
        // Length of vertex info in memory
        arrayStride: 8,
        // Info per Vertex
        attributes: [{
            // Position (x, y) Format
            format: "float32x2",
            // Buffer Offset
            offset: 0,
            // Position, see vertex shader
            shaderLocation: 0,
        }],
    };

    //Cell Shader
    const cellShaderModule = device.createShaderModule({
        label: "Cell shader",
        code: `
                //Vertex Inputs
                struct VertexInput {
                    @location(0) pos: vec2f,
                    @builtin(instance_index) instance: u32,
                };

                //Vertex Ouputs
                struct VertexOutput {
                    @builtin(position) pos: vec4f,
                    @location(0) cell: vec2f,
                };

                //Uniforms
                @group(0) @binding(0) var<uniform> grid: vec2f;
                //Storage
                @group(0) @binding(1) var<storage> cellState: array<u32>;

                //Vertex Shader
                @vertex
                fn vertexMain(input: VertexInput) -> VertexOutput {

                    //Variables
                    let i = f32(input.instance);
                    let cell = vec2f(i % grid.x, floor(i / grid.y));
                    let state = f32(cellState[input.instance]);

                    //Move square accordingly
                    let gridPos = (input.pos * state + 1 + cell * 2) / grid - 1;

                    var output: VertexOutput;
                    output.pos = vec4f(gridPos, 0, 1);
                    output.cell = cell;
                    return output;
                } 

                @fragment
                fn fragmentMain(@location(0) cell: vec2f) -> @location(0) vec4f {
                    let c = cell / grid;
                    return vec4f(c, 1 - c.x, 1);
                }
            `
    });

    // Create the compute shader that will process the simulation.
    const simulationShaderModule = device.createShaderModule({
        label: "Game of Life simulation shader",
        code: `
            //Grid Size Uniform
            @group(0) @binding(0) var<uniform> grid: vec2f;

            //Read/Write storage cell buffers
            @group(0) @binding(1) var<storage> cellStateIn: array<u32>;
            @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

            //Linearalizes (x, y)
            fn cellIndex(cell: vec2u) -> u32 {
                //return cell.y * u32(grid.x) + cell.x;
                // Cell Wrap-Around functionality
                return (cell.y % u32(grid.y)) * u32(grid.x) +
                    (cell.x % u32(grid.x));
            }

            //Return if said cell at coordinate is active
            fn cellActive(x: u32, y: u32) -> u32 {
                return cellStateIn[cellIndex(vec2(x, y))];
            }

            @compute
            // Divided Grid working size
            @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
                //Flips Value
                /*if (cellStateIn[cellIndex(cell.xy)] == 1) {
                    cellStateOut[cellIndex(cell.xy)] = 0;
                } else {
                    cellStateOut[cellIndex(cell.xy)] = 1;
                }*/

                // Determine how many active neighbors this cell has.
                let activeNeighbors = cellActive(cell.x+1, cell.y+1) +
                    cellActive(cell.x+1, cell.y) +
                    cellActive(cell.x+1, cell.y-1) +
                    cellActive(cell.x, cell.y-1) +
                    cellActive(cell.x-1, cell.y-1) +
                    cellActive(cell.x-1, cell.y) +
                    cellActive(cell.x-1, cell.y+1) +
                    cellActive(cell.x, cell.y+1);

                let i = cellIndex(cell.xy);

                // Conway's game of life rules:
                    switch activeNeighbors {
                    case 2: { // Active cells with 2 neighbors stay active.
                        cellStateOut[i] = cellStateIn[i];
                    }
                    case 3: { // Cells with 3 neighbors become or stay active.
                        cellStateOut[i] = 1;
                    }
                    default: { // Cells with < 2 or > 3 neighbors become inactive.
                        cellStateOut[i] = 0;
                    }
                }
            }`
    });

    //Binds buffers to different shader types
    const bindGroupLayout = device.createBindGroupLayout({
        label: "Cell Bind Group Layout",
        entries: [{
            // Grid Size Uniform Buffer
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
            // Type of Buffer, Texture, or Sampler
            buffer: {} //Default is "uniform"
        }, {
            //Read-Only Cell States
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: { type: "read-only-storage"}
        }, {
            //Write Cell States
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage"}
        }]
    });

    const pipelineLayout = device.createPipelineLayout({
        label: "Cell Pipeline Layout",
        //Group -> 0
        bindGroupLayouts: [ bindGroupLayout ],
    });

    //Create Render Pipeline for Shaders
    const cellPipeline = device.createRenderPipeline({
        label: "Cell pipeline",
        // Inputs other than vertex buffers
        layout: pipelineLayout, //Use "auto" if there's only 1 pipeline at play
        vertex: {
            // Shader
            module: cellShaderModule,
            // Function
            entryPoint: "vertexMain",
            // Inputs
            buffers: [vertexBufferLayout]
        },
        fragment: {
            // Shader
            module: cellShaderModule,
            // Function
            entryPoint: "fragmentMain",
            // Format of output
            targets: [{
                format: canvasFormat
            }]
        }
    });

    //Create a compute pipeline that updates the game state
    const simulationPipeline = device.createComputePipeline({
        label: "Simulation pipeline",
        layout: pipelineLayout,
        compute: {
            module: simulationShaderModule,
            entryPoint: "computeMain",
        }
    });

    //Define bind group for uniform and storage buffers
    const bindGroups = [
        device.createBindGroup({
            label: "Cell renderer bind group A",
            // Define types of resources in bind group
            layout: bindGroupLayout, //Use if only 1 pipeline -> cellPipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: { buffer: uniformBuffer }
            },
            {
                binding: 1,
                resource: { buffer: cellStateStorage[0] }
            },
            {
                binding: 2,
                resource: { buffer: cellStateStorage[1] }
            }]
        }),
        device.createBindGroup({
            label: "Cell renderer bind group B",
            // Define types of resources in bind group
            layout: bindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: uniformBuffer }
            },
            {
                binding: 1,
                resource: { buffer: cellStateStorage[1] }
            },
            {
                binding: 2,
                resource: { buffer: cellStateStorage[0] }
            }],
        }),
    ];

    //--RENDERING--

    //Repeatable Function
    function updateGrid() {
        //Interface with the GPU to draw on the Canvas
        const encoder = device.createCommandEncoder();

        //Computation Pass
        const computePass = encoder.beginComputePass();

        //Grid Computations
        computePass.setPipeline(simulationPipeline);
        computePass.setBindGroup(0, bindGroups[step % 2]);

        //Queue Work based on Grid Size and Workgroup Sizes
        const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);

        //Start Computations
        computePass.end();

        //Animation Frame
        step++;

        //Rendering pass
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                // Canvas's width/height/textureFormat info
                view: context.getCurrentTexture().createView(),
                // First Action
                loadOp: "clear",
                // Set the Clear Value to Blue
                clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
                // Last Action
                storeOp: "store",
            }]
        });

        //Add cells Shader Pipeline
        // Set pipeline to use with vertex buffer
        pass.setPipeline(cellPipeline);
        // Pass Verticies into Buffer for use in Pipeline
        pass.setVertexBuffer(0, vertexBuffer);
        // Set uniform bind groups to use in Pipeline (Flips every cycle)
        pass.setBindGroup(0, bindGroups[step % 2]);
        // Draw this many verticies with this many instances using the Buffer and Pipeline
        pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE); // 6, 16

        //End of Rendering Instructions
        pass.end();

        //Queue and submit rendering passes to GPU
        device.queue.submit([encoder.finish()]);
    }

    setInterval(updateGrid, UPDATE_INTERVAL);
}

function squareToTriangles(verticies)
{
    return new Float32Array(
        [verticies[0], verticies[1], verticies[2], verticies[3], verticies[4], verticies[5],
        verticies[0], verticies[1], verticies[4], verticies[5], verticies[6], verticies[7]]);
}

initCanvas()
