var PARTSYS_VSHADER =
    'precision mediump float;\n' +
    'uniform   int u_runMode; \n' +
    'uniform mat4 u_ModelMat;\n' +
    'uniform mat4 u_MVPMat;\n' +
    'uniform vec3 u_EyePos;\n' +
    'attribute vec4 a_Position;\n' +
    'attribute vec3 a_Color;\n' + 
    'attribute float a_PointSize;\n' +
    'varying   vec4 v_Color; \n' +
    'void main() {\n' +
    'float distance = length(u_EyePos - a_Position.xyz);\n' +
    '  gl_PointSize = a_PointSize/pow(distance, 0.33);\n' +
    'mat4 totModelMat =  u_MVPMat * u_ModelMat;\n' +
    '  gl_Position = totModelMat * a_Position;\n' +
    '  if(u_runMode == 0) { \n' +
        '	   v_Color = vec4(1.0, 0.0, 0.0, 1.0);	\n' +	// red: 0==reset
        '  	 } \n' +
        '  else if(u_runMode == 1) {  \n' +
        '    v_Color = vec4(1.0, 1.0, 0.0, 1.0); \n' +	// yellow: 1==pause
        '    }  \n' +
        '  else if(u_runMode == 2) { \n' +    
        '    v_Color = vec4(1.0, 1.0, 1.0, 1.0); \n' +	// white: 2==step
    '    } \n' +
        '  else { \n' +
        '    v_Color = vec4(a_Color.xyz, 1.0); \n' +	// green: >=3 ==run
        '		 } \n' +
    '} \n';

var PARTSYS_FSHADER =
    'precision mediump float;\n' +
    'varying vec4 v_Color; \n' +
    'void main() {\n' +
    '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
    '  if(dist < 0.5) { \n' +	
        '  	gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0);\n' +
        '  } else { discard; }\n' +
    '}\n';


var PARTSYS_FSHADER_2 =
    'precision mediump float;\n' +
    'varying vec4 v_Color; \n' +
    'void main() {\n' +
    '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
    '  if(dist < 0.6) { \n' +	
        '  	gl_FragColor = vec4(v_Color.rgb, 1.0);\n' +
        '  } else { discard; }\n' +
    '}\n';

var PARTSYS_FSHADER_3 =
    'precision mediump float;\n' +
    'varying vec4 v_Color; \n' +
    'void main() {\n' +
    '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
    '  if(dist < 0.5) { \n' +	
    '  	gl_FragColor = vec4(v_Color.rgb, 1.0);\n' +
    '  } else { discard; }\n' +
    '}\n';

var GRIDS_VSHADER =	
    'precision highp float;\n' +
    'uniform mat4 u_ModelMat1;\n' +
    'uniform mat4 u_MVPMat1;\n' +
    'attribute vec4 a_Pos1;\n' +
    'attribute vec3 a_Colr1;\n'+
    'varying vec3 v_Colr1;\n' +
    'void main() {\n' +
    'mat4 totModelMat =  u_MVPMat1 * u_ModelMat1;\n' +
    '  gl_Position = totModelMat * a_Pos1;\n' +
    '	 v_Colr1 = a_Colr1;\n' +
    ' }\n';
  
var GRIDS_FSHADER = 
    'precision mediump float;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);\n' + 
    '}\n';