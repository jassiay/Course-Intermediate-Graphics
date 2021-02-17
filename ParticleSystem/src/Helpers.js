class Grids {
	constructor(xCount, yCount, xyMax) {
		this.xCount = xCount;
		this.yCount = yCount;
		this.xyMax = xyMax;
		
		var xgap = xyMax/(xCount-1);
		var ygap = xyMax/(yCount-1);
		
		this.totalDim = 7;	
		this.vboVerts = 2*this.xCount + 2*this.yCount + 6;	
		this.vboContents = new Float32Array (this.totalDim*this.vboVerts );
	
		for(var v=0; v<2*this.xCount; v++) {
			if(v%2==0) {	
				this.vboContents[this.totalDim*v] = -this.xyMax+ v*xgap;
				this.vboContents[this.totalDim*v+1] = -this.xyMax;
			} else {
				this.vboContents[this.totalDim*v] = -this.xyMax+ (v-1)*xgap;
				this.vboContents[this.totalDim*v+1] = this.xyMax;
			}
			this.vboContents[this.totalDim*v+2] = 0.0;
			this.vboContents[this.totalDim*v+3] = 1.0;
			
		}
		for(v=0; v<this.yCount*2; v++) {
			var offset = this.totalDim*(v+2*this.xCount);
			if(v%2==0) {
				this.vboContents[offset] = -this.xyMax;
				this.vboContents[offset+1] = -this.xyMax + v*ygap;
			} else {
				this.vboContents[offset]  = this.xyMax;	
				this.vboContents[offset + 1] =  -this.xyMax+ (v-1)*ygap; 	
			}
			this.vboContents[offset + 2]  = 0.0;
			this.vboContents[offset + 3]  = 1.0;
			
		}
		this.vboLoc;								
		this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
		this.shaderLoc;
	
		this.a_PosLoc;						
	
		this.ModelMat = new Matrix4();
		this.u_ModelMatLoc;		
		
		this.MVPMat = new Matrix4();
		this.u_MVPMatLoc;
	}

	init = () => {
		this.shaderLoc = createProgram(gl, GRIDS_VSHADER, GRIDS_FSHADER);
		if (!this.shaderLoc) {
			console.log(this.constructor.name + '.init() failed to create executable Shaders on the GPU. Bye!');
			return;
		}
	
		gl.program = this.shaderLoc;		
		this.vboLoc = gl.createBuffer();	
		if (!this.vboLoc) {
			console.log(this.constructor.name + '.init() failed to create VBO in GPU. Bye!'); 
			return;
		}
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
		gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);			
								   
	
		this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
		if(this.a_PosLoc < 0) {
			console.log(this.constructor.name + '.init() Failed to get GPU location of attribute a_Pos1');
			return -1;
		}
		this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr1');
		if(this.a_ColrLoc < 0) {
			console.log(this.constructor.name + '.init() failed to get the GPU location of attribute a_Colr1');
			return -1;
		}
	
		gl.vertexAttribPointer(this.a_PosLoc,4,gl.FLOAT,false,1*this.FSIZE,0);
			
			
		gl.vertexAttribPointer(this.a_ColrLoc, 3, gl.FLOAT, false, 7*this.FSIZE, 4*this.FSIZE);
								
		gl.enableVertexAttribArray(this.a_PosLoc);
		gl.enableVertexAttribArray(this.a_ColrLoc);
		
		this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat1');
		if (!this.u_ModelMatLoc) { 
			console.log(this.constructor.name + '.init() failed to get GPU location for u_ModelMat1 uniform');
			return;
		}
	  
		this.u_MVPMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_MVPMat1');
		if (!this.u_MVPMatLoc) { 
			console.log(this.constructor.name + '.init() failed to get GPU location for u_MVPMat1 uniform');
			return;
		}
	}

	adjust = (MVP_Matrix, BaseModelMat) => {
		gl.useProgram(this.shaderLoc);	
		this.MVPMat.set(MVP_Matrix);
		this.ModelMat.set(BaseModelMat);
		this.ModelMat.rotate(0, 1, 0, 0);
			this.ModelMat.translate(0, 0, 0);
		
		gl.uniformMatrix4fv(this.u_ModelMatLoc, false, this.ModelMat.elements);	
		gl.uniformMatrix4fv(this.u_MVPMatLoc,	false, this.MVPMat.elements);	
	}

	draw = ()=> {
		gl.useProgram(this.shaderLoc);	

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
		gl.vertexAttribPointer(this.a_PosLoc, 4, gl.FLOAT, false, 7*this.FSIZE, 0);
		gl.vertexAttribPointer(this.a_ColrLoc, 3, gl.FLOAT, false,  7*this.FSIZE, 4*this.FSIZE);
		gl.enableVertexAttribArray(this.a_PosLoc);
		gl.enableVertexAttribArray(this.a_ColrLoc);
	
		gl.drawArrays(gl.LINES, 0, this.vboVerts);	
	}
}

ROTATE_SPEED_YAW = 45;
ROTATING_YAW = 0;
ROTATE_SPEED_PITCH = 25;
ROTATING_PITCH = 0;

MOVEMENT_SPEED = 20;
MOVING = 0;
UPDOWN = 0;

STRAFE_SPEED = 8;
STRAFING = 0;

var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

//===================Mouse and Keyboard event-handling Callbacks================
//==============================================================================
function myMouseDown(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  	var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
};


function myMouseMove(ev) {

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  	var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'draw()' function instead)
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
	// Put it on our webpage too...
};


function myKeyDown(ev) {

}

function myKeyUp(ev) {

}

function myKeyPress(ev) {
  // RESET our g_timeStep min/max recorder:
	g_timeStepMin = g_timeStep;
	g_timeStepMax = g_timeStep;
	myChar = String.fromCharCode(ev.keyCode);
	switch(myChar) {
		case '[':
			RUN_MODE = 0;			// RESET!
			break;
		case ';':
			RUN_MODE = 1;			// PAUSE!
			break;
		case 'n':
		case 'N':
			RUN_MODE = 2;			// PAUSE!
			break;
		case 'm':
		case 'M':					// RUN!
			RUN_MODE = 3;
			break;
		
		case 'w':
		case 'W':
			MoveForward();
			break;
		case 's':
		case 'S':
			MoveBackward();
			break;
		case 'a':
		case 'A':
			StrafeLeft();
			break;
		case 'd':
		case 'D':
			StrafeRight();
			break;
		case 'q':
		case 'Q':
			Rotate_Yaw_CCW();
			break;
		case 'e':
		case 'E':
			Rotate_Yaw_CW();
			break;
		case 'z':	
		case 'Z':	
			Rotate_Pitch_Up();
		break;
		case 'c':	
		case 'C':	
			Rotate_Pitch_Down();
		break;
		
		case 'I': 
		case 'i':
			Interaction_Wind();
			break;	
		
		case 'Y': 
		case 'y':
			Interaction_Fire();
			break;	

		case 'o':
		case 'O':
			Interaction_Rope();
			break;

		case 'u':
		case 'U':
			Interaction_Boids();

			break;

		case 'p':
		case 'P':
			CamPosUp();
			break;
		case 'l':
		case 'L':
			CamPosDown();
			break;
		default:
			console.log('myKeyPress(): Ignored key: '+myChar);
			break;
	}
}

function Change_Solver_Dropdown(selectObject) {
	var value = selectObject.value;
	switch(value) {
		case '0':
			SOLVER_TYPE = 0;
			break;
		case '1':
			SOLVER_TYPE = 1;
			break;
		case '2':
			SOLVER_TYPE = 2;
			break;
		case '3':
			SOLVER_TYPE = 3;
			break;
		case '4':
			SOLVER_TYPE = 4;
			break;
		default:
			SOLVER_TYPE = 3;
			break;
	}
	console.log("Solver Type: "+ SOLVER_TYPE);
}

function Interaction_Fire() {
	if (FIRE_COLOR == 0) {
		FIRE_COLOR = 1;
		fire.startColor = {'R' :  0.0, 'G' : 0.0, 'B' : 1.0};
		fire.endColor = {'R' :  0.0, 'G' : 1.0, 'B' : 1.0};
	} else {
		fire.startColor = {'R' :  1.0, 'G' : 0.0, 'B' : 0.0};
		fire.endColor = {'R' :  1.0, 'G' : 1.0, 'B' : 0.0};
		FIRE_COLOR = 0;
	}
	console.log(FIRE_COLOR);
}

function Interaction_Boids() {
	OBSTACLE_LEVEL++;
	if (OBSTACLE_LEVEL >= 3) {
		OBSTACLE_LEVEL = -3;
	}
	boids.limiters = boids.limiters.slice(0, L_MAXVAR);
	var Anchor = new CLimit();
	console.log(OBSTACLE_LEVEL);
	Anchor.initAnchor(boids.partCount - 1, 0, 0, 5 + OBSTACLE_LEVEL*2);
	boids.limiters = boids.limiters.concat(Anchor.attributes);
}

function Interaction_Wind() {
	WIND_DIR = -WIND_DIR;
	console.log(WIND_DIR);
}

function Interaction_Rope() {
	ROPE_LEVEL++;
	if (ROPE_LEVEL == 5) {
		ROPE_LEVEL = -2;
	}
	// console.log(rope.limiters);
	rope.limiters = rope.limiters.slice(0, L_MAXVAR);
	var Anchor = new CLimit();
	console.log(ROPE_LEVEL);
	Anchor.initAnchor(11, 0, 3, 6 + ROPE_LEVEL);
	rope.limiters = rope.limiters.concat(Anchor.attributes);

}

function Rotate_Yaw_CCW(){
	ROTATING_YAW = 5;
}
function Rotate_Yaw_CW(){
	ROTATING_YAW = -5;
}
function Rotate_Pitch_Up(){
	ROTATING_PITCH = 5;
}
function Rotate_Pitch_Down(){
	ROTATING_PITCH = -5;
}
function MoveForward(){
	MOVING = 5;
}
function MoveBackward(){
	MOVING = -5;
}
function StrafeLeft(){
	STRAFING = 5;
}
function StrafeRight(){
	STRAFING  = -5;
}
function CamPosDown(){
	UPDOWN = -3;
}
function CamPosUp(){
	UPDOWN = 3;
}

function animateYaw(){
	if(elapsed< 1000){
		var Rotate = new Matrix4();
		
		Yaw = (Yaw + ROTATING_YAW *elapsed/1000*ROTATE_SPEED_YAW)%360;
		Rotate.rotate(Pitch, 0 , -1 ,0);
		LookAt = new Vector4([1,0,0,0]);
		LookAt = Rotate.multiplyVector4(LookAt);
		ROTATING_YAW = 0;
	}
	
}
function animatePitch(){
	if(elapsed< 1000){
		var factor = elapsed/1000*MOVEMENT_SPEED*ROTATING_PITCH;
		
		var Rotate = new Matrix4();
		if( (Pitch < 80  ||  ROTATING_PITCH <  0) && (ROTATING_PITCH > 0 || Pitch > -80)){
			Pitch +=  ROTATING_PITCH *elapsed/1000*ROTATE_SPEED_PITCH;
		}
		Rotate.setRotate(Yaw, 0, 0, 1);
		Rotate.rotate(Pitch, 0 , -1 ,0);
		LookAt = new Vector4([1,0,0,0]);
		LookAt = Rotate.multiplyVector4(LookAt);
		
		ROTATING_PITCH = 0;
	}
	
}

function animateCameraMovement(){
	if(elapsed < 1000){
		var factor = elapsed/1000*MOVEMENT_SPEED*MOVING;
		
		Center = new Vector4([Center.elements[0] + LookAt.elements[0]*factor,
			Center.elements[1] + LookAt.elements[1]*factor,
			Center.elements[2] + LookAt.elements[2]*factor,
			Center.elements[3] + LookAt.elements[3]*factor,]);
		MOVING = 0;
	}
}

function animateCameraUpDown(){
	if(elapsed < 1000){
		var factor = elapsed/1000*MOVEMENT_SPEED*UPDOWN;
		
		Center = new Vector4([Center.elements[0],
			Center.elements[1],
			Center.elements[2] + factor,
			Center.elements[3]]);
		UPDOWN = 0;
	}
}

function animateCameraStrafe(){
	if(elapsed < 1000){
		var factor = elapsed/1000*STRAFE_SPEED*STRAFING;

		var Rotate = new Matrix4();
		Rotate.setRotate(Yaw,0,0,1);
		Rotate.rotate(Pitch, 0 ,-1, 0);
		Rotate.rotate(90, 0, 0, 1);
		var Perp = new Vector4([1,0,0,0]);
		var Perp = Rotate.multiplyVector4(Perp);
		Center = new Vector4([Center.elements[0] + Perp.elements[0]*factor,
			Center.elements[1] + Perp.elements[1]*factor,
			Center.elements[2] + Perp.elements[2]*factor,
			Center.elements[3] + Perp.elements[3]*factor,]);
		STRAFING = 0;
	}
}

function AllAnimations(){
	animateYaw();
	animatePitch();
	animateCameraMovement();
	animateCameraUpDown();
	animateCameraStrafe();
}