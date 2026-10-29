#version 300 es
  precision highp float;
  in vec3 vColor; in float vAlpha; out vec4 frag;
  void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;float a=exp(-r*3.2)*vAlpha;frag=vec4(vColor,a);}
