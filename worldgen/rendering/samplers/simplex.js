
//Not similar to Hytale's Methods due to Open Source Agreement
//https://compute.toys/view/16

export const simplex2D = `
    fn simplex2D(x: f32, z: f32) -> f32 {
        //Scale
        let p = vec2f(x, z) * .01;

        let K1 = 0.366025404; // (sqrt(3)-1)/2;
        let K2 = 0.211324865; // (3-sqrt(3))/6;
        let i = floor( p + (p.x+p.y)*K1 );
        let a = p - i + (i.x+i.y)*K2;
        //let o = step(a.yx,a.xy);
        let o = select(vec2f(0, 1), vec2f(1, 0), a.x > a.y);
        let b = a - o + K2;
        let c = a - 1.0 + 2.0*K2;
        let h = max( 0.5-vec3f(dot(a,a), dot(b,b), dot(c,c) ), vec3f(0.) );
        let n = h*h*h*h*vec3f( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
        return dot( n, vec3f(70.0) );
    }

    fn hash(p: vec2f) -> vec2f // replace this by something better
    {
        let p2 = vec2f( dot(p,vec2f(127.1,311.7)), dot(p,vec2f(269.5,183.3)) );
        return -1.0 + 2.0*fract(sin(p2)*43758.5453123);
    }
    `

export const simplex3D = `
    /* skew constants for 3d simplex functions */
    const F3 = 0.3333333;
    const G3 = 0.1666667;

    fn simplex3D(x_: f32, y: f32, z: f32) -> f32
    {
        //Scale
        let p = vec3f(x_, y, z) * .01;

        /* 1. find current tetrahedron T and it's four vertices */
        /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
        /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/

        /* calculate s and x */
        let s = floor(p + dot(p, vec3(F3)));
        let x = p - s + dot(s, vec3(G3));

        /* calculate i1 and i2 */
        let e = step(vec3(0.0), x - x.yzx);
        let i1 = e*(1.0 - e.zxy);
        let i2 = 1.0 - e.zxy*(1.0 - e);

        /* x1, x2, x3 */
        let x1 = x - i1 + G3;
        let x2 = x - i2 + 2.0*G3;
        let x3 = x - 1.0 + 3.0*G3;

        /* 2. find four surflets and store them in d */
        var w = vec4f(0.);
        var d = vec4f(0.);

        /* calculate surflet weights */
        w.x = dot(x, x);
        w.y = dot(x1, x1);
        w.z = dot(x2, x2);
        w.w = dot(x3, x3);

        /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
        w = max(0.6 - w, vec4f(0.0));

        /* calculate surflet components */
        d.x = dot(random3(s), x);
        d.y = dot(random3(s + i1), x1);
        d.z = dot(random3(s + i2), x2);
        d.w = dot(random3(s + 1.0), x3);

        /* multiply d by w^4 */
        w *= w;
        w *= w;
        d *= w;

        /* 3. return the sum of the four surflets */
        return dot(d, vec4(52.0));
    }

    /* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
    fn random3(c: vec3f) -> vec3f
    {
        var j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
        var r = vec3f(0.);
        r.z = fract(512.0*j);
        j *= .125;
        r.x = fract(512.0*j);
        j *= .125;
        r.y = fract(512.0*j);
        return r - 0.5;
    }
    `