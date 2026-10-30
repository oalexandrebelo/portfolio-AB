#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;
  layout(location=1) in vec3 aBrand;
  layout(location=2) in vec3 aColor;
  layout(location=3) in float aSeed;
  uniform float uTime, uMorph, uAspect, uDpr;
  uniform vec2 uPointer;
  out vec3 vColor; out float vAlpha;
  void main(){
    vec3 p=mix(aBrand,aPosition,uMorph);
    float pulse=sin(uTime*.65+aSeed*6.283)*.006;
    p*=1.+pulse*uMorph;
    float yaw=uPointer.x*.10+sin(uTime*.16)*.025*uMorph;
    float pitch=uPointer.y*.045;
    mat2 ry=mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw));
    p.xz=ry*p.xz;
    mat2 rx=mat2(cos(pitch),-sin(pitch),sin(pitch),cos(pitch));
    p.yz=rx*p.yz;
    vec2 m=uPointer*vec2(2.5,-2.5);
    float dist=length(p.xy-m);
    float wave=exp(-dist*dist*1.8)*sin(uTime*1.6-dist*4.)*.018;
    p.z+=wave;
    float persp=4.5/(4.5-p.z*.21);
    gl_Position=vec4(p.x*.355/uAspect*persp,p.y*.355*persp,0.,1.);
    gl_PointSize=clamp((1.25+aSeed*.85)*uDpr*persp,1.,4.8);
    vColor=mix(vec3(.70,.82,1.),aColor,uMorph);
    vAlpha=.31+aSeed*.19;
  }
