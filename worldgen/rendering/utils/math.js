
export const remap = `
    fn remap(value: f32, inMin: f32, inMax: f32, outMin: f32, outMax: f32) -> f32 {
        return (value - inMin) / (inMax - inMin) * (outMax - outMin) + outMin;
    }
    `

export const rotate = `
    fn rotate(vec: vec3f, rot: f32) -> vec3f {
        let rad = rot * .05;
        return vec3f(cos(rad) * vec.x - sin(rad) * vec.z, vec.y, sin(rad) * vec.x + cos(rad) * vec.z);
    }
`

export const twist = `
    const PI: f32 = 3.14159265359;

    fn twist(vec: vec3f, origin: vec3f, axis: vec3f, t1: vec2f, t2: vec2f) -> vec3f {
        let dist = distance(vec, origin) * .007;
        let angle = clamp(remap(dist, t1.x, t2.x, t1.y, t2.y), min(t1.y, t2.y), max(t1.y, t2.y)) / 180 * PI;
        //return vec3f(angle);
        return vec3f(vec * cos(angle) + cross(axis, vec) * sin(angle) + axis * dot(axis, vec) * (1 - cos(angle)));
    }
`