#version 300 es
  precision highp float;in vec2 uv;uniform sampler2D uImage,uGlow;uniform float uBloom;out vec4 frag;
  void main(){vec3 c=texture(uImage,uv).rgb+texture(uGlow,uv).rgb*uBloom;
  float vignette=1.-smoothstep(.42,.72,length(uv-.5));c*=vignette;
  frag=vec4(c,clamp(max(c.r,max(c.g,c.b))*1.15,0.,1.));}
