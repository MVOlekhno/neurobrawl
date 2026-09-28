import{t as e}from"./texture-C9p0zbK8.js";var t=`
uniform sampler2D uCarveMask;
uniform vec3 uMaskMin;
uniform vec3 uMaskSize;
uniform vec3 uMaskDims;
uniform vec2 uAtlasTiles;
uniform vec2 uAtlasSize;
uniform vec4 uFlash[8];
uniform float uFlashRadius;
uniform vec3 uScorchColor;
uniform float uColorMax;
uniform vec4 uNeedle2;
uniform vec2 uNearFade;
uniform vec4 uCam;
uniform vec4 uCone;

// set in modifySplatRotationScale, used by modifySplatColor of the same vertex
float nbAlpha = 1.0;

float nbHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1) * 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// 0..1: how deep inside the cone from the camera to the fighter a point is (the last 0.6 m, the ground under the
// fighter, is left alone)
float nbCone(vec3 p) {
    vec3 cw = uCone.xyz - uCam.xyz;
    float l2 = max(dot(cw, cw), 1e-4);
    float l = sqrt(l2);
    float t = dot(p - uCam.xyz, cw) / l2;
    float r = length(p - (uCam.xyz + clamp(t, 0.0, 1.0) * cw));
    float radius = mix(1.0, 0.55, t);
    return (1.0 - smoothstep(radius, radius + 0.35, r)) * step(0.0, t) * (1.0 - smoothstep(1.0 - 0.8 / l, 1.0 - 0.5 / l, t));
}

vec4 carveSlice(vec2 xy, float z) {
    vec2 tile = vec2(mod(z, uAtlasTiles.x), floor(z / uAtlasTiles.x));
    vec2 uv = (tile * uMaskDims.xy + xy) / uAtlasSize;
    return textureLod(uCarveMask, uv, 0.0);
}

vec4 carveSampleMask(vec3 p) {
    vec3 uvw = (p - uMaskMin) / uMaskSize;
    if (any(lessThan(uvw, vec3(0.0))) || any(greaterThan(uvw, vec3(1.0)))) return vec4(0.0);
    vec2 xy = clamp(uvw.xy * uMaskDims.xy, vec2(0.5), uMaskDims.xy - 0.5);
    float zf = clamp(uvw.z * uMaskDims.z - 0.5, 0.0, uMaskDims.z - 1.0);
    float z0 = floor(zf);
    float z1 = min(z0 + 1.0, uMaskDims.z - 1.0);
    return mix(carveSlice(xy, z0), carveSlice(xy, z1), zf - z0);
}

void modifySplatCenter(inout vec3 center) {
}

void modifySplatRotationScale(vec3 originalCenter, vec3 modifiedCenter, inout vec4 rotation, inout vec3 scale) {
    float carved = carveSampleMask(modifiedCenter).r;
    if (carved > 0.5) {
        scale = vec3(0.0);
    } else {
        scale *= 1.0 - smoothstep(0.2, 0.5, carved);
    }
    nbAlpha = 1.0;
    float lo = min(min(scale.x, scale.y), scale.z);
    float hi = max(max(scale.x, scale.y), scale.z);
    float mid = scale.x + scale.y + scale.z - lo - hi;
    if (uNeedle2.z > 0.0 && mid < uNeedle2.z * hi) {
        nbAlpha = uNeedle2.w;
        if (nbAlpha <= 0.0) {
            scale = vec3(0.0);
            return;
        }
    }
    if (uNeedle2.x > 0.0) scale = min(scale, vec3(max(mid * uNeedle2.x, uNeedle2.y)));
    if (uNearFade.y > 0.0) {
        float near = smoothstep(uNearFade.x, uNearFade.y, distance(modifiedCenter, uCam.xyz));
        nbAlpha *= near;
        scale *= mix(0.4, 1.0, near);
    }
    if (uCone.w > 0.0) {
        float cone = nbCone(modifiedCenter) * uCone.w;
        if (nbHash(modifiedCenter) < cone * 0.7) {
            scale = vec3(0.0);
            return;
        }
        nbAlpha *= mix(1.0, 0.12, cone);
    }
}

void modifySplatColor(vec3 center, inout vec4 color) {
    if (uColorMax > 0.0) color.rgb = min(color.rgb, vec3(uColorMax));
    color.a *= nbAlpha;
    vec4 m = carveSampleMask(center);
    color.rgb = mix(color.rgb, color.rgb * uScorchColor, m.g);
    vec3 glow = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        vec4 f = uFlash[i];
        if (f.w <= 0.0) continue;
        float k = f.w * (1.0 - smoothstep(0.0, uFlashRadius, distance(center, f.xyz)));
        glow += vec3(1.0, 0.55, 0.2) * k * 1.4;
    }
    color.rgb += glow;
}
`,n=`
var uCarveMask: texture_2d<f32>;
var uCarveMaskSampler: sampler;
uniform uMaskMin: vec3f;
uniform uMaskSize: vec3f;
uniform uMaskDims: vec3f;
uniform uAtlasTiles: vec2f;
uniform uAtlasSize: vec2f;
uniform uFlash: array<vec4f, 8>;
uniform uFlashRadius: f32;
uniform uScorchColor: vec3f;
uniform uColorMax: f32;
uniform uNeedle2: vec4f;
uniform uNearFade: vec2f;
uniform uCam: vec4f;
uniform uCone: vec4f;

var<private> nbAlpha: f32 = 1.0;

fn nbHash(q: vec3f) -> f32 {
    let p = fract(q * 0.3183099 + 0.1) * 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

fn nbCone(p: vec3f) -> f32 {
    let cw = uniform.uCone.xyz - uniform.uCam.xyz;
    let l2 = max(dot(cw, cw), 1e-4);
    let l = sqrt(l2);
    let t = dot(p - uniform.uCam.xyz, cw) / l2;
    let r = length(p - (uniform.uCam.xyz + clamp(t, 0.0, 1.0) * cw));
    let radius = mix(1.0, 0.55, t);
    return (1.0 - smoothstep(radius, radius + 0.35, r)) * step(0.0, t) * (1.0 - smoothstep(1.0 - 0.8 / l, 1.0 - 0.5 / l, t));
}

fn carveSlice(xy: vec2f, z: f32) -> vec4f {
    let row = floor(z / uniform.uAtlasTiles.x);
    let tile = vec2f(z - row * uniform.uAtlasTiles.x, row);
    let uv = (tile * uniform.uMaskDims.xy + xy) / uniform.uAtlasSize;
    return textureSampleLevel(uCarveMask, uCarveMaskSampler, uv, 0.0);
}

fn carveSampleMask(p: vec3f) -> vec4f {
    let uvw = (p - uniform.uMaskMin) / uniform.uMaskSize;
    if (any(uvw < vec3f(0.0)) || any(uvw > vec3f(1.0))) {
        return vec4f(0.0);
    }
    let xy = clamp(uvw.xy * uniform.uMaskDims.xy, vec2f(0.5), uniform.uMaskDims.xy - vec2f(0.5));
    let zf = clamp(uvw.z * uniform.uMaskDims.z - 0.5, 0.0, uniform.uMaskDims.z - 1.0);
    let z0 = floor(zf);
    let z1 = min(z0 + 1.0, uniform.uMaskDims.z - 1.0);
    return mix(carveSlice(xy, z0), carveSlice(xy, z1), zf - z0);
}

fn modifySplatCenter(center: ptr<function, vec3f>) {
}

fn modifySplatRotationScale(originalCenter: vec3f, modifiedCenter: vec3f, rotation: ptr<function, vec4f>, scale: ptr<function, vec3f>) {
    let carved = carveSampleMask(modifiedCenter).r;
    if (carved > 0.5) {
        *scale = vec3f(0.0);
    } else {
        *scale = *scale * (1.0 - smoothstep(0.2, 0.5, carved));
    }
    nbAlpha = 1.0;
    let sc = *scale;
    let lo = min(min(sc.x, sc.y), sc.z);
    let hi = max(max(sc.x, sc.y), sc.z);
    let mid = sc.x + sc.y + sc.z - lo - hi;
    if (uniform.uNeedle2.z > 0.0 && mid < uniform.uNeedle2.z * hi) {
        nbAlpha = uniform.uNeedle2.w;
        if (nbAlpha <= 0.0) {
            *scale = vec3f(0.0);
            return;
        }
    }
    if (uniform.uNeedle2.x > 0.0) {
        *scale = min(*scale, vec3f(max(mid * uniform.uNeedle2.x, uniform.uNeedle2.y)));
    }
    if (uniform.uNearFade.y > 0.0) {
        let near = smoothstep(uniform.uNearFade.x, uniform.uNearFade.y, distance(modifiedCenter, uniform.uCam.xyz));
        nbAlpha = nbAlpha * near;
        *scale = *scale * mix(0.4, 1.0, near);
    }
    if (uniform.uCone.w > 0.0) {
        let cone = nbCone(modifiedCenter) * uniform.uCone.w;
        if (nbHash(modifiedCenter) < cone * 0.7) {
            *scale = vec3f(0.0);
            return;
        }
        nbAlpha = nbAlpha * mix(1.0, 0.12, cone);
    }
}

fn modifySplatColor(center: vec3f, color: ptr<function, vec4f>) {
    let m = carveSampleMask(center);
    var rgb = (*color).rgb;
    if (uniform.uColorMax > 0.0) {
        rgb = min(rgb, vec3f(uniform.uColorMax));
    }
    rgb = mix(rgb, rgb * uniform.uScorchColor, m.g);
    var glow = vec3f(0.0);
    for (var i = 0; i < 8; i++) {
        let f = uniform.uFlash[i];
        if (f.w <= 0.0) {
            continue;
        }
        let k = f.w * (1.0 - smoothstep(0.0, uniform.uFlashRadius, distance(center, f.xyz)));
        glow += vec3f(1.0, 0.55, 0.2) * k * 1.4;
    }
    *color = vec4f(rgb + glow, (*color).a * nbAlpha);
}
`,r=.03,i=.5,a=class{texture;data;material;cam=new Float32Array(4);cone=new Float32Array(4);tilesX;atlasW;flash=new Float32Array(32);flashes=[];terrain;original;constructor(r,i,a,o){this.terrain=a,this.original=o;let{nx:s,ny:c,nz:l}=a;this.tilesX=Math.ceil(Math.sqrt(l));let u=Math.ceil(l/this.tilesX);this.atlasW=s*this.tilesX;let d=c*u;this.texture=new e(i,{name:`splatCarveMask`,width:this.atlasW,height:d,format:7,mipmaps:!1,minFilter:1,magFilter:1,addressU:1,addressV:1}),this.data=this.texture.lock(),this.data.fill(0),this.texture.unlock();let f=r.scene.gsplat.material;f.getShaderChunks(`glsl`).set(`gsplatModifyVS`,t),f.getShaderChunks(`wgsl`).set(`gsplatModifyVS`,n),f.setParameter(`uCarveMask`,this.texture),f.setParameter(`uMaskMin`,[a.origin.x,a.origin.y,a.origin.z]),f.setParameter(`uMaskSize`,[s*a.voxel,c*a.voxel,l*a.voxel]),f.setParameter(`uMaskDims`,[s,c,l]),f.setParameter(`uAtlasTiles`,[this.tilesX,u]),f.setParameter(`uAtlasSize`,[this.atlasW,d]),f.setParameter(`uScorchColor`,[.22,.18,.15]),f.setParameter(`uFlashRadius`,2.5),f.setParameter(`uColorMax`,1),f.setParameter(`uNeedle2`,[5,.015,.02,0]),f.setParameter(`uNearFade`,[1.2,3]),f.setParameter(`uCam`,[0,0,0,0]),f.setParameter(`uCone`,[0,0,0,0]),f.setParameter(`uFlash[0]`,this.flash),f.update(),this.material=f}set needle(e){this.material.setParameter(`uNeedle2`,e>0?[e,.015,.02,0]:[0,0,0,0])}set colorMax(e){this.material.setParameter(`uColorMax`,e)}nearFade(e,t){this.material.setParameter(`uNearFade`,[e,t])}view(e,t,n){this.cam.set([e.x,e.y,e.z,1]),this.cone.set(t?[t.x,t.y,t.z,n]:[0,0,0,0])}blast(e,t){let n=this.terrain,i=t*1.6+n.voxel*2,a=(e,t)=>(e-t)/n.voxel-.5,o=Math.max(0,Math.floor(a(e.x-i,n.origin.x))),s=Math.max(0,Math.floor(a(e.y-i,n.origin.y))),c=Math.max(0,Math.floor(a(e.z-i,n.origin.z))),l=Math.min(n.nx-1,Math.ceil(a(e.x+i,n.origin.x))),u=Math.min(n.ny-1,Math.ceil(a(e.y+i,n.origin.y))),d=Math.min(n.nz-1,Math.ceil(a(e.z+i,n.origin.z))),f=t*1.5;this.texture.lock();for(let i=c;i<=d;i++)for(let a=s;a<=u;a++)for(let s=o;s<=l;s++){let o=s+a*n.nx+i*n.nx*n.ny,c=(this.original[o]??0)-(n.data[o]??0),l=Math.min(1,Math.max(0,(c-r)/.09)),u=n.origin.x+(s+.5)*n.voxel-e.x,d=n.origin.y+(a+.5)*n.voxel-e.y,p=n.origin.z+(i+.5)*n.voxel-e.z,m=Math.hypot(u,d,p),h=m<=t?1:Math.max(0,1-(m-t)/(f-t)),g=i%this.tilesX*n.nx+s,_=((Math.floor(i/this.tilesX)*n.ny+a)*this.atlasW+g)*4;this.data[_]=Math.max(this.data[_]??0,Math.round(l*255)),this.data[_+1]=Math.max(this.data[_+1]??0,Math.round(h*220))}this.texture.unlock(),this.flashes.push({pos:{...e},t:0}),this.flashes.length>8&&this.flashes.shift()}update(e){for(let t=this.flashes.length-1;t>=0;t--){let n=this.flashes[t];n&&(n.t+=e,n.t>i&&this.flashes.splice(t,1))}this.flash.fill(0),this.flashes.forEach((e,t)=>this.flash.set([e.pos.x,e.pos.y,e.pos.z,1-e.t/i],t*4)),this.material.setParameter(`uFlash[0]`,this.flash),this.material.setParameter(`uCam`,this.cam),this.material.setParameter(`uCone`,this.cone),this.material.update()}};export{a as SplatCarve};