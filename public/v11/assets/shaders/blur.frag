#version 300 es
  precision highp float;in vec2 uv;uniform sampler2D uImage;uniform vec2 uStep;out vec4 frag;
  void main(){vec4 c=texture(uImage,uv)*.227027;c+=texture(uImage,uv+uStep*1.384615)*.316216;c+=texture(uImage,uv-uStep*1.384615)*.316216;c+=texture(uImage,uv+uStep*3.230769)*.070270;c+=texture(uImage,uv-uStep*3.230769)*.070270;frag=c;}
