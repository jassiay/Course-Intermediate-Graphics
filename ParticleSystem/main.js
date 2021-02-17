var gl;  
var g_canvas;
var isClear = 1;
var g_last = Date.now();
var g_stepCount = 0;

var g_timeStep = 1000.0/60;
var g_timeStepMin = g_timeStep;
var g_timeStepMax = g_timeStep;

var wind = new PartSys();  
var rope = new PartSys();  
var fire = new PartSys();
var boids = new PartSys();

LookAt = new Vector4();
Center = new Vector4();
Up =  new Vector4();
Yaw = 0;
Pitch = 0;

var MVPMatrix = new Matrix4();
var grid;

function main() {
	g_canvas = document.getElementById('webgl');
	gl = g_canvas.getContext("webgl", { preserveDrawingBuffer: true});
	
	if (!gl) {
		console.log('main() Failed to get the rendering context for WebGL');
	return;}

	g_canvas.onmousedown = function(ev){myMouseDown(ev) }; 
	g_canvas.onmousemove = 	function(ev){myMouseMove(ev) };				
	g_canvas.onmouseup = function(ev){myMouseUp(ev) };
					
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("keypress", myKeyPress, false);

	gl.clearColor(0.5, 0.5, 0.5, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	grid = new Grids(40, 40, 30);
	grid.init();  
	
	wind.initWind(450);
	boids.initBoids(100);
	fire.initFire(1500);
	rope.initRope(12);

	Center = new Vector4([-30.0, 0.0, 10.0, 1.0]);
	LookAt = new Vector4([1,0,-1,0]);
	Up = new Vector4([0,0,1,0]);

	var tick = function() {
		g_timeStep = animate(); 
		if (g_timeStep > 2000) {   
			g_timeStep = 1000/60;
		}
		if (g_timeStep < g_timeStepMin) g_timeStepMin = g_timeStep;  
		else if(g_timeStep > g_timeStepMax) g_timeStepMax = g_timeStep;
		
		draw();    
		AllAnimations();
		requestAnimationFrame(tick, g_canvas);
	};
		
	tick();
}

function animate() {
	var now = Date.now();	        
	elapsed = now - g_last;
	g_last = now;
	g_stepCount = (g_stepCount +1)%1000;

	return elapsed;
}

function draw() {	
	if(isClear == 1) gl.clear(gl.COLOR_BUFFER_BIT);
	
  	if(RUN_MODE > 1){
		if(RUN_MODE == 2) RUN_MODE = 1;
		
		wind.dotFinder(wind.s1dot, wind.s1);
		wind.applyForces(wind.s1, wind.forces);
		wind.solver();
		wind.doConstraint();
		wind.swap();

		rope.dotFinder(rope.s1dot, rope.s1);
		rope.applyForces(rope.s1, rope.forces);
		rope.solver();
		rope.doConstraint();
		rope.swap();

		boids.dotFinder(boids.s1dot, boids.s1);
		boids.applyForces(boids.s1, boids.forces);
		boids.solver();
		boids.doConstraint();
		boids.swap();

		fire.dotFinder(fire.s1dot, fire.s1);
		fire.applyForces(fire.s1, fire.forces);
		fire.solver();

		fire.doConstraint();
		fire.swap();
	}

	var mvp = new Matrix4();
	mvp.setPerspective(60.0,  16/9, 1.0, 1000.0); 
	
	mvp.lookAt( 
				Center.elements[0], Center.elements[1], Center.elements[2], 
                Center.elements[0] + LookAt.elements[0], Center.elements[1] + LookAt.elements[1],Center.elements[2] + LookAt.elements[2], 
                Up.elements[0], Up.elements[1], Up.elements[2]);
	
	
	var modelMatrix = new Matrix4();
	
	tempEye = new Vector3([Center.elements[0], Center.elements[1], Center.elements[2]]);
	grid.adjust(modelMatrix, mvp);
	grid.draw();

	pushMatrix(modelMatrix);
		modelMatrix.translate(10, 10, 0);
		rope.render(modelMatrix, mvp, tempEye);    
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
		modelMatrix.translate(10, -10, 0);
		boids.render(modelMatrix, mvp, tempEye);    
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
		modelMatrix.translate(-10, 10, 0);
		wind.render(modelMatrix, mvp, tempEye);
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
		modelMatrix.translate(-10, -10, 0);
		fire.render(modelMatrix, mvp, tempEye);    
	modelMatrix = popMatrix();
	
}